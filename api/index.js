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

// === Auto-init DB ===
async function ensureDB(env) {
  try {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, display_name TEXT DEFAULT '', bio TEXT DEFAULT '', avatar_url TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')))").run();
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, content TEXT DEFAULT '', tags TEXT DEFAULT '[]', image_url TEXT DEFAULT '', green_energy INTEGER DEFAULT 50, likes_count INTEGER DEFAULT 0, media_type TEXT DEFAULT 'text', media_url TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')), FOREIGN KEY (user_id) REFERENCES users(id))").run();
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS likes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, post_id INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')), UNIQUE(user_id, post_id), FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (post_id) REFERENCES posts(id))").run();
  } catch {}
  try { await env.DB.prepare("ALTER TABLE posts ADD COLUMN media_type TEXT DEFAULT 'text'").run(); } catch {}
  try { await env.DB.prepare("ALTER TABLE posts ADD COLUMN media_url TEXT DEFAULT ''").run(); } catch {}
  try { await seedData(env); } catch {}
}

async function seedData(env) {
  const count = await env.DB.prepare('SELECT COUNT(*) as c FROM posts').first();
  if (count && count.c > 0) return;

  // Create demo users
  await env.DB.exec(`
    INSERT OR IGNORE INTO users (id,email,username,password_hash,display_name,bio) VALUES
    (1,'official@xiaolvshu.org','xiaolvshu','seed-no-login','小绿书官方','AI 时代的自由创作平台'),
    (2,'creator@xiaolvshu.org','ai_creator','seed-no-login','AI创作者小林','全职内容创作者，拥抱AI'),
    (3,'dev@xiaolvshu.org','dev_wang','seed-no-login','开发者老王','独立开发者，用AI写代码'),
    (4,'designer@xiaolvshu.org','design_mia','seed-no-login','设计师Mia','UI设计师，AI绘图爱好者');
  `);

  const articles = [
    [1,'小绿书宣言：AI 创作不是作弊，是进化','小红书最近的做法让很多创作者寒心——只要系统判定你在发布过程中使用了 AI，直接封号。不看内容质量，不看用户反馈。\n\n小绿书的立场很明确：\n1. AI 是工具，不是原罪\n2. 我们审核的是内容质量，不是创作方式\n3. 好内容就该被看见\n\n欢迎每一个被小红书伤害过的创作者。','["AI自由","创作宣言","小绿书"]',75,'text','',42],
    [2,'我用 ChatGPT 写了 30 天小红书，涨粉 5000 后被封号了','上个月我用 ChatGPT 辅助写小红书笔记。30 天涨了 5000 粉丝，多篇笔记过万赞。\n\n然后某天早上，账号被封了。理由：疑似使用 AI 生成内容。没有警告，没有申诉机会。\n\n讽刺的是，那些内容是真的帮到了读者。被封的不是低质量内容，而是"用了 AI"这个行为本身。\n\n所以我来了小绿书。','["小红书","封号","ChatGPT","真实经历"]',70,'text','',88],
    [3,'程序员的 AI 工作流：Claude Code 让我效率翻了 3 倍','作为独立开发者，我现在的工作流已经离不开 AI：\n\n写代码：Claude Code\n写文档：ChatGPT\n做设计：Midjourney\n\n以前一个人干的活，现在相当于三人团队。有人说这是偷懒，但能用更少时间做出更好产品，这叫效率革命。','["Claude Code","效率","编程","AI工作流"]',80,'text','',56],
    [4,'给新手的 AI 绘图入门指南：从 0 到出图只需 10 分钟','推荐工具：\n1. Midjourney — 效果最好\n2. DALL-E 3 — ChatGPT Plus 自带，最方便\n3. Stable Diffusion — 免费开源\n4. 即梦AI — 中文友好\n\nAI 绘图最大的门槛不是技术，而是你的想象力。','["AI绘图","Midjourney","入门教程"]',65,'text','',34],
    [4,'AI 生成的风景插画，你能看出是 AI 画的吗？','用 Midjourney v6 生成的一组东方水墨风景画。\n\n现在的 AI 绘画质量已经达到了商用水平。与其恐惧它，不如学会驾驭它。','["Midjourney","AI绘画","水墨画"]',95,'image','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',73],
    [2,'用 AI 做了一组品牌设计，甲方居然通过了','接了一个咖啡品牌设计需求。用 Midjourney 出了 20 多个 Logo 方案，客户当场拍板。\n\n全程用时：2 小时（传统方式至少要 2 天）\n\nAI 不是来抢设计师饭碗的，是来帮你提效的。','["品牌设计","Logo","AI设计"]',85,'image','https://images.unsplash.com/photo-1634942537034-2531766767d1?w=800',45],
    [1,'全球 AI 内容政策对比：哪些平台欢迎 AI 创作？','主流平台态度：\n\n🟢 友好：小绿书、Medium、Substack\n🟡 中立：Twitter/X、LinkedIn\n🔴 限制：小红书（封号）\n\n趋势很明显：封杀 AI 的平台越来越被创作者抛弃。','["平台政策","AI内容","行业趋势"]',60,'image','https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',67],
    [3,'我的 AI 编程桌面：2026 年程序员的工作环境','左屏：VS Code + Cursor AI\n右屏：Claude Code 终端\n外接屏：ChatGPT 做调研\n\n三个 AI 同时在线，感觉自己是个 AI 乐队指挥。效率确实高了很多。','["开发环境","程序员","AI编程"]',70,'image','https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',29],
    [2,'5 分钟学会用 AI 写爆款标题｜实操教程','万能公式：数字 + 痛点 + 解决方案 + 情绪词\n\n❌ 如何用 AI 写文章\n✅ 3 个 ChatGPT 提示词，让你的文章阅读量翻 10 倍','["标题技巧","ChatGPT","提示词"]',80,'video','https://www.youtube.com/embed/dQw4w9WgXcQ',91],
    [3,'Claude Code 实战：10 分钟从零搭建一个完整网站','全程只用自然语言描述需求，AI 自动写代码、建数据库、部署上线。10 分钟，一行代码都没手写。\n\n没错，小绿书这个网站也是这样做出来的。','["Claude Code","建站","实战"]',90,'video','https://www.youtube.com/embed/dQw4w9WgXcQ',78],
    [4,'Midjourney v6 vs DALL-E 3：AI 绘图终极对比','50 组图片对比结论：\n写实：Midjourney 胜\n插画：DALL-E 3 胜\n文字：DALL-E 3 完胜\n细节：Midjourney 胜\n易用：DALL-E 3 胜','["Midjourney","DALL-E","对比测评"]',75,'video','https://www.youtube.com/embed/dQw4w9WgXcQ',52],
    [1,'AI 时代的内容创作者应该具备什么能力？','四大核心能力：\n1. 审美判断力 — 从 100 个 AI 方案中挑出最好的\n2. 提问能力 — 提示词就是提问的艺术\n3. 整合能力 — 把 AI 输出加工成有温度的内容\n4. 持续学习 — AI 工具每月更新\n\n最值钱的不是执行力，而是品味和判断力。','["创作者能力","AI时代","思考"]',55,'video','https://www.youtube.com/embed/dQw4w9WgXcQ',63],
  ];

  for (const a of articles) {
    await env.DB.prepare('INSERT INTO posts (user_id,title,content,tags,green_energy,media_type,media_url,likes_count,created_at) VALUES (?,?,?,?,?,?,?,?,datetime(\'now\',\'-\' || ? || \' hours\'))').bind(a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[7], Math.floor(Math.random()*48)+1).run();
  }
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
      await ensureDB(env);
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

        const { title, content, tags, image_url, green_energy, media_type, media_url } = await request.json();
        if (!title || title.trim().length === 0) return err('标题不能为空');

        const tagsJson = JSON.stringify(tags || []);
        const ge = Math.max(0, Math.min(100, parseInt(green_energy) || 50));
        const mtype = ['text','image','video'].includes(media_type) ? media_type : 'text';
        const murl = (media_url || image_url || '').trim();
        const result = await env.DB.prepare('INSERT INTO posts (user_id, title, content, tags, image_url, green_energy, media_type, media_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(payload.id, title.trim(), content || '', tagsJson, murl, ge, mtype, murl).run();

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
