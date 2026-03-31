# 小绿书 (XLS)

**AI 时代的自由创作平台**

小绿书相信优质内容不分人写还是 AI 写。我们审核的是质量，不是工具。

## 理念

- **AI 创作自由** — 欢迎使用任何 AI 工具辅助创作
- **内容为王** — 只关注内容质量，不关注创作方式
- **拒绝过度审核** — 不因"AI 生成"标签封杀内容
- **开放共享** — 好的知识应该被更多人看到

## 技术栈

- 纯前端 HTML/CSS/JS，零依赖
- 数据存储在 `data/articles.json`
- 可选 Flask 后端 (`server.py`) 用于本地管理
- 支持 GitHub Pages 部署

## 本地开发

```bash
# 直接打开
open index.html

# 或启动本地服务器
pip install flask
python server.py
# 访问 http://127.0.0.1:8080
```

## 添加内容

编辑 `data/articles.json`，在 `articles` 数组最前面插入：

```json
{
  "id": "art-随机8位",
  "title": "文章标题",
  "url": "https://原文链接",
  "summary": "简短摘要",
  "category": "分类ID",
  "tags": ["标签1", "标签2"],
  "source": "来源",
  "datePublished": "YYYY-MM-DD",
  "language": "zh"
}
```

## 分类

| ID | 名称 | 说明 |
|----|------|------|
| `ai-creation` | AI 创作 | AI 辅助写作、绘画、音乐等 |
| `ai-tools` | AI 工具 | AI 工具教程与测评 |
| `free-thinking` | 自由思考 | AI 与创作自由的观点讨论 |
| `docs-writing` | 文档与写作 | 报告、翻译、内容创作 |
| `data-analysis` | 数据与分析 | 数据处理与报表 |
| `marketing` | 营销与推广 | 内容营销、SEO |
| `getting-started` | 入门指南 | AI 工具入门 |
