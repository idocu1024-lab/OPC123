// Daily AI post generator for 小绿书
// Uses Gemini 3.0 Flash for text, Unsplash for cover images

const API_BASE = process.env.API_BASE || 'https://xls-api.beebeeai666.workers.dev';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const BOT_KEY = process.env.BOT_KEY;

const TOPICS = [
  'AI 写作技巧和提示词分享',
  'AI 绘图工具对比和教程',
  'AI 编程效率提升经验',
  'AI 时代的职业规划和技能',
  'AI 内容创作的伦理和自由',
  '小红书 vs 小绿书：内容平台政策对比',
  'ChatGPT / Claude / Gemini 使用技巧',
  'AI 视频生成工具推荐',
  'AI 音乐创作工具体验',
  'AI 翻译和多语言内容创作',
  '独立开发者如何用 AI 提效',
  'AI 在设计领域的应用',
  '用 AI 做数据分析和报表',
  'AI 辅助学习和知识管理',
  '最新 AI 行业新闻和趋势',
  'Midjourney vs Stable Diffusion 实测',
  'AI 自动化办公实战经验',
  '如何用 AI 做自媒体运营',
  'AI 生成的内容算不算原创？',
  '未来 5 年 AI 会取代哪些工作？',
];

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
    }),
  });
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function getUnsplashImage(tags) {
  const fallbacks = ['artificial+intelligence', 'technology+future', 'creative+workspace',
    'digital+art', 'coding+laptop', 'data+visualization', 'modern+office', 'innovation'];
  const q = tags.length ? tags.slice(0, 2).join('+').replace(/\s/g, '+') : fallbacks[Math.floor(Math.random() * fallbacks.length)];
  return `https://source.unsplash.com/800x500/?${q}`;
}

async function publishPost(post) {
  const res = await fetch(`${API_BASE}/bot/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Bot-Key': BOT_KEY },
    body: JSON.stringify(post),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function main() {
  if (!GEMINI_KEY) { console.error('GEMINI_API_KEY not set'); process.exit(1); }
  if (!BOT_KEY) { console.error('BOT_KEY not set'); process.exit(1); }
  console.log('Starting daily posts...');

  const shuffled = TOPICS.sort(() => Math.random() - 0.5).slice(0, 3);

  for (let i = 0; i < 3; i++) {
    const topic = shuffled[i];
    const isImage = i < 2;
    console.log(`Generating post ${i + 1}/3: ${topic}`);

    const prompt = `你是小绿书（xiaolvshu.org）的 AI 内容助手。小绿书是一个 AI 友好的内容平台，鼓励用 AI 创作。

请围绕「${topic}」写一篇短帖子，要求：
- 标题：15字以内，吸引眼球
- 正文：200-400字，口语化，有干货，分段落，适合社交媒体阅读
- 标签：3-4个相关中文标签
- 绿能值：60-95之间的整数（表示 AI 参与度）

严格按以下 JSON 格式输出，不要输出其他内容：
{"title":"标题","content":"正文","tags":["标签1","标签2","标签3"],"green_energy":80}`;

    try {
      const raw = await callGemini(prompt);
      // Strip markdown code fences if present
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) { console.log('  Failed to parse, raw:', raw.slice(0, 200)); continue; }

      const post = JSON.parse(match[0]);
      if (isImage) {
        post.media_type = 'image';
        post.media_url = getUnsplashImage(post.tags || []);
      } else {
        post.media_type = 'text';
      }

      const result = await publishPost(post);
      console.log(`  Published: ${post.title} (id: ${result.id})`);
    } catch (e) {
      console.error(`  Error: ${e.message}`);
    }
  }
  console.log('Done!');
}

main();
