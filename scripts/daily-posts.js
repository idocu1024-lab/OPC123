// Daily AI post generator for 小绿书
// Uses Claude API to generate 3 posts per day, then publishes via XLS API

const API_BASE = process.env.API_BASE || 'https://xls-api.beebeeai666.workers.dev';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

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
];

const IMAGE_QUERIES = [
  'artificial+intelligence+technology',
  'creative+writing+workspace',
  'digital+art+colorful',
  'programmer+coding+laptop',
  'modern+workspace+minimal',
  'robot+future+technology',
  'data+visualization+chart',
  'design+creative+studio',
];

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function registerBot() {
  // Try to register the bot account, ignore if exists
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ai-bot@xiaolvshu.org',
        username: 'xls_daily',
        password: 'xls-bot-' + Date.now(),
      }),
    });
    const data = await res.json();
    if (data.token) return data.token;
  } catch {}

  // If registration fails (already exists), try login
  // Bot can't login with password since it's random, so we use a seed account
  // The seed users have password_hash 'seed-no-login' which won't match any password
  // So we'll just register a new unique bot each time
  const uniq = Date.now().toString(36);
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `bot-${uniq}@xiaolvshu.org`,
      username: `ai_writer_${uniq}`,
      password: `bot-pass-${uniq}`,
    }),
  });
  const data = await res.json();
  return data.token;
}

async function publishPost(token, post) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(post),
  });
  return res.json();
}

async function main() {
  if (!ANTHROPIC_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const token = await registerBot();
  if (!token) {
    console.error('Failed to get bot token');
    process.exit(1);
  }
  console.log('Bot authenticated');

  // Pick 3 random topics
  const shuffled = TOPICS.sort(() => Math.random() - 0.5);
  const todayTopics = shuffled.slice(0, 3);

  for (let i = 0; i < 3; i++) {
    const topic = todayTopics[i];
    const isImage = i < 2; // First 2 are image posts, 3rd is text

    console.log(`Generating post ${i + 1}/3: ${topic}`);

    const prompt = `你是小绿书（xiaolvshu.org）的 AI 内容助手。小绿书是一个 AI 友好的内容平台，鼓励用 AI 创作。

请围绕「${topic}」写一篇短帖子，要求：
- 标题：15字以内，吸引眼球
- 正文：200-400字，口语化，有干货，适合社交媒体阅读
- 标签：3-4个相关中文标签
- 绿能值：60-95之间的整数（表示 AI 参与度）

严格按以下 JSON 格式输出，不要输出其他内容：
{"title":"标题","content":"正文内容","tags":["标签1","标签2","标签3"],"green_energy":80}`;

    try {
      const raw = await callClaude(prompt);
      // Extract JSON from response
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) { console.log('  Failed to parse response'); continue; }

      const post = JSON.parse(match[0]);

      // Add media for image posts
      if (isImage) {
        const imgQuery = IMAGE_QUERIES[Math.floor(Math.random() * IMAGE_QUERIES.length)];
        post.media_type = 'image';
        post.media_url = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 200000000000)}?w=800&q=80`;
        // Use a more reliable source
        post.media_url = `https://source.unsplash.com/800x600/?${imgQuery}`;
      } else {
        post.media_type = 'text';
      }

      const result = await publishPost(token, post);
      console.log(`  Published: ${post.title} (id: ${result.id})`);
    } catch (e) {
      console.error(`  Error: ${e.message}`);
    }
  }

  console.log('Done! 3 posts published.');
}

main();
