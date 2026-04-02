// Daily AI post generator for 小绿书
// Uses Gemini Flash for text, Unsplash for cover images

const API_BASE = process.env.API_BASE || 'https://xls-api.beebeeai666.workers.dev';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const BOT_KEY = process.env.BOT_KEY;

const TOPICS = [
  'AI 写作技巧和提示词分享', 'AI 绘图工具对比和教程', 'AI 编程效率提升经验',
  'AI 时代的职业规划和技能', 'AI 内容创作的伦理和自由', 'ChatGPT / Claude / Gemini 使用技巧',
  'AI 视频生成工具推荐', '独立开发者如何用 AI 提效', 'AI 在设计领域的应用',
  '用 AI 做数据分析和报表', '最新 AI 行业新闻和趋势', 'AI 自动化办公实战经验',
  '如何用 AI 做自媒体运营', 'AI 生成的内容算不算原创？', 'AI 辅助学习和知识管理',
];

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    }),
  });
  const data = await res.json();
  if (data.error) {
    console.error('  Gemini API error:', JSON.stringify(data.error));
    return null;
  }
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

function getUnsplashImage(tags) {
  const fallbacks = ['artificial+intelligence', 'technology+future', 'creative+workspace',
    'digital+art', 'coding+laptop', 'data+visualization', 'modern+office', 'innovation'];
  const q = tags.length ? tags.slice(0, 2).join('+').replace(/\s/g, '+') : fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return `https://source.unsplash.com/800x500/?${q}`;
}

async function publishViaBotEndpoint(post) {
  const res = await fetch(`${API_BASE}/bot/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Bot-Key': BOT_KEY },
    body: JSON.stringify(post),
  });
  const data = await res.json();
  console.log('  Bot endpoint response:', JSON.stringify(data));
  if (data.ok || data.id) return data;
  throw new Error(data.error || 'Unknown error');
}

async function publishViaRegister(post) {
  // Fallback: register a new user and post normally
  const uniq = Date.now().toString(36);
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `bot-${uniq}@xiaolvshu.org`, username: `ai_bot_${uniq}`, password: `pass-${uniq}` }),
  });
  const regData = await regRes.json();
  console.log('  Register response:', JSON.stringify(regData));
  if (!regData.token) throw new Error('Register failed: ' + (regData.error || ''));

  const postRes = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${regData.token}` },
    body: JSON.stringify(post),
  });
  const postData = await postRes.json();
  console.log('  Post response:', JSON.stringify(postData));
  return postData;
}

async function publishPost(post) {
  // Try bot endpoint first, fallback to register+post
  try {
    return await publishViaBotEndpoint(post);
  } catch (e) {
    console.log('  Bot endpoint failed:', e.message, '- trying register fallback');
    return await publishViaRegister(post);
  }
}

async function main() {
  if (!GEMINI_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }
  console.log('Config:', { API_BASE, hasGeminiKey: !!GEMINI_KEY, hasBotKey: !!BOT_KEY });

  const shuffled = TOPICS.sort(() => Math.random() - 0.5).slice(0, 3);

  for (let i = 0; i < 3; i++) {
    const topic = shuffled[i];
    const isImage = i < 2;
    console.log(`\nGenerating post ${i + 1}/3: ${topic}`);

    const prompt = `你是小绿书（xiaolvshu.org）的 AI 内容助手。请围绕「${topic}」写一篇短帖子。
要求：标题15字以内，正文200-400字口语化有干货，3-4个中文标签，绿能值60-95整数。
输出纯JSON，不要markdown：{"title":"标题","content":"正文","tags":["标签1","标签2"],"green_energy":80}`;

    try {
      const raw = await callGemini(prompt);
      if (!raw) { console.log('  Gemini returned empty'); continue; }
      console.log('  Gemini raw (first 100):', raw.slice(0, 100));

      // Clean and parse
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      let post;
      try {
        post = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) { console.log('  Cannot extract JSON'); continue; }
        post = JSON.parse(match[0]);
      }

      console.log('  Parsed:', post.title);

      if (isImage) {
        post.media_type = 'image';
        post.media_url = getUnsplashImage(post.tags || []);
      } else {
        post.media_type = 'text';
      }

      const result = await publishPost(post);
      console.log(`  SUCCESS: ${post.title} (id: ${result.id})`);
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
    }
  }
  console.log('\nDone!');
}

main();
