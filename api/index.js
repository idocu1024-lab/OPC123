// 小绿书 API — Cloudflare Worker + D1

// === Crypto helpers ===
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const hashArr = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltStr = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return saltStr + ':' + hashArr;
}

async function verifyPassword(password, stored) {
  const [saltStr, hashStr] = stored.split(':');
  const salt = new Uint8Array(saltStr.match(/.{2}/g).map(b => parseInt(b, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
  const hashArr = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashArr === hashStr;
}

async function createJWT(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const body = btoa(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).replace(/=/g, '');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(header + '.' + body));
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return header + '.' + body + '.' + sigStr;
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBuf = Uint8Array.from(atob(sig.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBuf, new TextEncoder().encode(header + '.' + body));
    if (!valid) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

// === Response helpers ===
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  });
}

function err(msg, status = 400) {
  return json({ error: msg }, status);
}

// === Auth middleware ===
async function getUser(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const payload = await verifyJWT(auth.slice(7), env.JWT_SECRET);
  if (!payload) return null;
  return payload;
}

// === Router ===
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // --- Auth ---
      if (path === '/auth/register' && method === 'POST') {
        const { email, username, password } = await request.json();
        if (!email || !username || !password) return err('请填写邮箱、用户名和密码');
        if (password.length < 6) return err('密码至少 6 位');
        if (username.length < 2 || username.length > 20) return err('用户名 2-20 个字符');

        const exists = await env.DB.prepare('SELECT id FROM users WHERE email = ? OR username = ?').bind(email, username).first();
        if (exists) return err('邮箱或用户名已被注册', 409);

        const hash = await hashPassword(password);
        const result = await env.DB.prepare('INSERT INTO users (email, username, password_hash, display_name) VALUES (?, ?, ?, ?)').bind(email, username, hash, username).run();
        const userId = result.meta.last_row_id;
        const token = await createJWT({ id: userId, username }, env.JWT_SECRET);
        return json({ token, user: { id: userId, username, email, display_name: username } }, 201);
      }

      if (path === '/auth/login' && method === 'POST') {
        const { email, password } = await request.json();
        if (!email || !password) return err('请填写邮箱和密码');

        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        if (!user || !(await verifyPassword(password, user.password_hash))) return err('邮箱或密码错误', 401);

        const token = await createJWT({ id: user.id, username: user.username }, env.JWT_SECRET);
        return json({ token, user: { id: user.id, username: user.username, email: user.email, display_name: user.display_name, bio: user.bio, avatar_url: user.avatar_url } });
      }

      if (path === '/auth/me' && method === 'GET') {
        const payload = await getUser(request, env);
        if (!payload) return err('未登录', 401);
        const user = await env.DB.prepare('SELECT id, email, username, display_name, bio, avatar_url, created_at FROM users WHERE id = ?').bind(payload.id).first();
        if (!user) return err('用户不存在', 404);
        return json({ user });
      }

      // --- Posts ---
      if (path === '/posts' && method === 'GET') {
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = 20;
        const offset = (page - 1) * limit;
        const tag = url.searchParams.get('tag');
        const userId = url.searchParams.get('user_id');

        let query = `SELECT p.*, u.username, u.display_name, u.avatar_url FROM posts p JOIN users u ON p.user_id = u.id`;
        const conditions = [];
        const params = [];

        if (tag) {
          conditions.push(`p.tags LIKE ?`);
          params.push(`%"${tag}"%`);
        }
        if (userId) {
          conditions.push(`p.user_id = ?`);
          params.push(parseInt(userId));
        }

        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const posts = await env.DB.prepare(query).bind(...params).all();

        // Check if current user liked these posts
        const payload = await getUser(request, env);
        let likedSet = new Set();
        if (payload && posts.results.length) {
          const ids = posts.results.map(p => p.id).join(',');
          const liked = await env.DB.prepare(`SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${ids})`).bind(payload.id).all();
          likedSet = new Set(liked.results.map(l => l.post_id));
        }

        const data = posts.results.map(p => ({
          ...p,
          tags: JSON.parse(p.tags || '[]'),
          liked: likedSet.has(p.id),
        }));

        return json({ posts: data, page });
      }

      if (path === '/posts' && method === 'POST') {
        const payload = await getUser(request, env);
        if (!payload) return err('请先登录', 401);

        const { title, content, tags, image_url, green_energy } = await request.json();
        if (!title || title.trim().length === 0) return err('标题不能为空');

        const tagsJson = JSON.stringify(tags || []);
        const ge = Math.max(0, Math.min(100, parseInt(green_energy) || 50));
        const result = await env.DB.prepare('INSERT INTO posts (user_id, title, content, tags, image_url, green_energy) VALUES (?, ?, ?, ?, ?, ?)').bind(payload.id, title.trim(), content || '', tagsJson, image_url || '', ge).run();

        return json({ id: result.meta.last_row_id, message: '发布成功' }, 201);
      }

      // Single post
      const postMatch = path.match(/^\/posts\/(\d+)$/);
      if (postMatch && method === 'GET') {
        const postId = parseInt(postMatch[1]);
        const post = await env.DB.prepare('SELECT p.*, u.username, u.display_name, u.avatar_url FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?').bind(postId).first();
        if (!post) return err('帖子不存在', 404);
        post.tags = JSON.parse(post.tags || '[]');

        const payload = await getUser(request, env);
        post.liked = false;
        if (payload) {
          const like = await env.DB.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').bind(payload.id, postId).first();
          post.liked = !!like;
        }
        return json({ post });
      }

      if (postMatch && method === 'DELETE') {
        const payload = await getUser(request, env);
        if (!payload) return err('请先登录', 401);
        const postId = parseInt(postMatch[1]);
        const post = await env.DB.prepare('SELECT user_id FROM posts WHERE id = ?').bind(postId).first();
        if (!post) return err('帖子不存在', 404);
        if (post.user_id !== payload.id) return err('只能删除自己的帖子', 403);
        await env.DB.prepare('DELETE FROM likes WHERE post_id = ?').bind(postId).run();
        await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();
        return json({ message: '已删除' });
      }

      // --- Likes ---
      const likeMatch = path.match(/^\/posts\/(\d+)\/like$/);
      if (likeMatch && method === 'POST') {
        const payload = await getUser(request, env);
        if (!payload) return err('请先登录', 401);
        const postId = parseInt(likeMatch[1]);

        const existing = await env.DB.prepare('SELECT id FROM likes WHERE user_id = ? AND post_id = ?').bind(payload.id, postId).first();

        if (existing) {
          await env.DB.prepare('DELETE FROM likes WHERE id = ?').bind(existing.id).run();
          await env.DB.prepare('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').bind(postId).run();
          const post = await env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first();
          return json({ liked: false, likes_count: post.likes_count });
        } else {
          await env.DB.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').bind(payload.id, postId).run();
          await env.DB.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').bind(postId).run();
          const post = await env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first();
          return json({ liked: true, likes_count: post.likes_count });
        }
      }

      // --- Vote (keep existing vote counter) ---
      if (path === '/vote' && method === 'GET') {
        const count = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
        return json({ count: count.count });
      }

      return err('Not found', 404);

    } catch (e) {
      return err('服务器错误: ' + e.message, 500);
    }
  }
};
