-- 创建官方账号（密码: xiaolvshu2026，实际是哈希值占位，通过API注册更安全）
INSERT OR IGNORE INTO users (id, email, username, password_hash, display_name, bio) VALUES
(1, 'official@xiaolvshu.org', 'xiaolvshu', 'seed-account-no-login', '小绿书官方', 'AI 时代的自由创作平台'),
(2, 'creator@xiaolvshu.org', 'ai_creator', 'seed-account-no-login', 'AI创作者小林', '全职内容创作者，拥抱AI'),
(3, 'dev@xiaolvshu.org', 'dev_wang', 'seed-account-no-login', '开发者老王', '独立开发者，用AI写代码'),
(4, 'designer@xiaolvshu.org', 'design_mia', 'seed-account-no-login', '设计师Mia', 'UI设计师，AI绘图爱好者');

-- === 文字帖（4篇）===

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(1, '小绿书宣言：AI 创作不是作弊，是进化',
'小红书最近的做法让很多创作者寒心——只要系统判定你在发布过程中使用了 AI，直接封号。不看内容质量，不看用户反馈，纯粹因为你用了一个工具。

这就像因为你用了美颜相机就封你的照片，因为你用了剪映就删你的视频。荒谬吗？荒谬。

小绿书的立场很明确：
1. AI 是工具，不是原罪
2. 我们审核的是内容质量，不是创作方式
3. 好内容就该被看见，管你用笔写还是用 AI 写

欢迎每一个被小红书伤害过的创作者。在这里，你可以自由地用 AI，专注做好内容。',
'["AI自由","创作宣言","小绿书","内容平台"]', 75, 'text', '', 42, datetime('now', '-6 hours'));

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(2, '我用 ChatGPT 写了 30 天小红书，涨粉 5000 后被封号了',
'分享一个真实经历。

上个月我开始用 ChatGPT 辅助写小红书笔记。流程很简单：自己定选题和大纲，让 AI 帮忙润色文字，最后自己配图发布。

效果很好——30 天涨了 5000 粉丝，多篇笔记过万赞。读者反馈也很正面，说内容"干货满满"。

然后某天早上，账号被封了。理由：疑似使用 AI 生成内容。

没有警告，没有申诉机会，5000 粉丝一夜归零。

讽刺的是，那些内容是真的帮到了读者。被封的不是低质量内容，而是"用了 AI"这个行为本身。

所以我来了小绿书。在这里，我可以光明正大地标注"绿能值 70%"，告诉读者这篇文章有 AI 参与，而不用藏着掖着。',
'["小红书","封号","ChatGPT","真实经历"]', 70, 'text', '', 88, datetime('now', '-5 hours'));

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(3, '程序员的 AI 工作流：Claude Code 让我效率翻了 3 倍',
'作为独立开发者，我现在的工作流已经完全离不开 AI 了：

**写代码**：Claude Code 直接在终端里帮我写功能、修 bug、重构代码
**写文档**：ChatGPT 帮我生成 API 文档和用户手册
**做设计**：Midjourney 出概念图，Figma AI 辅助排版
**写周报**：AI 总结这周的 git commit，自动生成周报

以前一个人干的活，现在相当于一个三人团队。

有人说这是"偷懒"。但我觉得，能用更少时间做出更好产品，这不叫偷懒，叫效率革命。

你的 AI 工作流是什么样的？评论区分享一下！',
'["Claude Code","效率","编程","AI工作流"]', 80, 'text', '', 56, datetime('now', '-4 hours'));

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(4, '给新手的 AI 绘图入门指南：从 0 到出图只需 10 分钟',
'很多朋友问我 AI 绘图难不难。说实话，现在入门门槛已经很低了。

**推荐工具**（按易用性排序）：
1. **Midjourney** — 效果最好，Discord 里直接用
2. **DALL-E 3** — ChatGPT Plus 自带，最方便
3. **Stable Diffusion** — 免费开源，但需要点技术基础
4. **即梦AI** — 中文友好，适合国内用户

**新手第一步**：
打开 ChatGPT，直接说"帮我画一个…"就行。不需要学复杂的提示词，用自然语言描述你想要的画面。

**进阶技巧**：
- 加入风格关键词：水彩风、赛博朋克、吉卜力风格
- 指定构图：特写、俯瞰、对称构图
- 控制色调：暖色调、莫兰迪色、高饱和

AI 绘图最大的门槛不是技术，而是你的想象力。',
'["AI绘图","Midjourney","入门教程","设计"]', 65, 'text', '', 34, datetime('now', '-3 hours'));

-- === 图文帖（4篇）===

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(4, 'AI 生成的风景插画，你能看出是 AI 画的吗？',
'用 Midjourney v6 生成的一组东方水墨风景画。提示词只用了"Chinese ink painting, misty mountains, peaceful lake, minimalist"。

现在的 AI 绘画质量已经达到了商用水平。与其恐惧它，不如学会驾驭它。

你觉得 AI 画的好看吗？',
'["Midjourney","AI绘画","水墨画","艺术"]', 95, 'image', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', 73, datetime('now', '-2 hours'));

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(2, '用 AI 做了一组品牌设计，甲方居然通过了',
'接了一个小型咖啡品牌的设计需求。预算不高，时间紧。

用 Midjourney 出了 20 多个 Logo 方案，筛选了 3 个给甲方。客户当场拍板选了第二个。

后来加了一些手动微调，最终交付。客户满意度 100%。

全程用时：2 小时（传统方式至少要 2 天）

AI 不是来抢设计师饭碗的，是来帮你提效的。',
'["品牌设计","Logo","AI设计","效率"]', 85, 'image', 'https://images.unsplash.com/photo-1634942537034-2531766767d1?w=800', 45, datetime('now', '-90 minutes'));

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(1, '全球 AI 内容政策对比：哪些平台欢迎 AI 创作？',
'我们整理了主流内容平台对 AI 内容的态度：

🟢 友好：小绿书、Medium、Substack、个人博客
🟡 中立：Twitter/X、LinkedIn（需标注）
🔴 限制：小红书（封号）、部分学术期刊

趋势很明显：开放的平台越来越多，封杀 AI 的平台越来越被创作者抛弃。

历史证明，对抗工具进步的平台最终都会失败。',
'["平台政策","AI内容","行业趋势","对比"]', 60, 'image', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', 67, datetime('now', '-1 hour'));

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(3, '我的 AI 编程桌面：这就是 2026 年程序员的工作环境',
'分享一下我日常的开发环境截图。

左屏：VS Code + Cursor AI 自动补全
右屏：Claude Code 终端 + 浏览器预览
外接屏：ChatGPT 做技术调研

三个 AI 同时在线，感觉自己是个"AI 乐队指挥"。

效率确实高了很多，但最重要的变化是——我现在可以把精力花在"想做什么"上，而不是"怎么做"上。',
'["开发环境","程序员","工作台","AI编程"]', 70, 'image', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800', 29, datetime('now', '-45 minutes'));

-- === 视频帖（4篇）===

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(2, '5 分钟学会用 AI 写爆款标题｜实操教程',
'很多人说 AI 写的标题没有吸引力，那是因为你的提示词不对。

这个视频教你一个万能公式：
数字 + 痛点 + 解决方案 + 情绪词

例如：
❌ "如何用 AI 写文章"
✅ "3 个 ChatGPT 提示词，让你的文章阅读量翻 10 倍"

视频里有完整的提示词模板，可以直接拿去用。',
'["标题技巧","ChatGPT","提示词","教程"]', 80, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 91, datetime('now', '-30 minutes'));

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(3, 'Claude Code 实战：10 分钟从零搭建一个完整网站',
'这个视频记录了我用 Claude Code 从零开始搭建一个博客网站的全过程。

全程只用自然语言描述需求，AI 自动写代码、建数据库、部署上线。

10 分钟，一行代码都没手写。

这就是 2026 年的开发方式。

（没错，小绿书这个网站也是这样做出来的）',
'["Claude Code","建站","实战","视频教程"]', 90, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 78, datetime('now', '-20 minutes'));

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(4, 'Midjourney v6 vs DALL-E 3：AI 绘图工具终极对比',
'花了一周时间，用同样的提示词分别在 Midjourney v6 和 DALL-E 3 上生成了 50 组图片。

结论：
- 写实风格：Midjourney 胜
- 创意插画：DALL-E 3 胜
- 文字渲染：DALL-E 3 完胜
- 细节精度：Midjourney 胜
- 易用性：DALL-E 3 胜（自然语言，不用学提示词）

总的来说没有绝对的赢家，看你的使用场景。视频里有详细的逐组对比。',
'["Midjourney","DALL-E","对比测评","AI绘图"]', 75, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 52, datetime('now', '-10 minutes'));

INSERT INTO posts (user_id, title, content, tags, green_energy, media_type, media_url, likes_count, created_at) VALUES
(1, 'AI 时代的内容创作者应该具备什么能力？',
'这是小绿书第一期圆桌讨论的录播。

我们邀请了三位不同领域的创作者，聊了聊 AI 时代创作者最需要的能力：

1. **审美判断力** — AI 能生成 100 个方案，你要能挑出最好的那个
2. **提问能力** — 提示词本质上就是提问的艺术
3. **整合能力** — 把 AI 的输出加工成有温度的内容
4. **持续学习** — AI 工具每个月都在更新，停下来就落后了

最核心的一点：AI 时代最值钱的不是执行力，而是品味和判断力。

完整讨论请看视频。',
'["圆桌讨论","创作者能力","AI时代","思考"]', 55, 'video', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 63, datetime('now', '-5 minutes'));
