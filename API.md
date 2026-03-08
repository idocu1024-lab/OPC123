# OpenClaw ABC API 接口文档

> 供 OpenClaw 调用，将分析后的文章数据发布到线上网站。

## 基础信息

| 项目 | 值 |
|------|------|
| 线上地址 | https://idocu1024-lab.github.io/OPC123/ |
| GitHub 仓库 | https://github.com/idocu1024-lab/OPC123 |
| 数据文件 | `data/articles.json` |
| 提交方式 | GitHub Contents API（读取→修改→提交） |

---

## 方式一：通过 GitHub API 提交（线上自动更新，推荐）

OpenClaw 分析完链接后，通过 GitHub API 直接更新仓库中的 `data/articles.json`，GitHub Pages 自动重新部署。

### 1. 读取当前文件

```
GET https://api.github.com/repos/idocu1024-lab/OPC123/contents/data/articles.json
Authorization: token YOUR_GITHUB_TOKEN
```

返回中提取：
- `content`：Base64 编码的文件内容
- `sha`：文件当前 SHA（更新时必须带上）

### 2. 修改 JSON

解码 `content`，在 `articles` 数组**最前面**插入新文章：

```json
{
  "id": "art-随机8位",
  "title": "中文标题",
  "url": "https://原文链接",
  "summary": "2-3句中文摘要",
  "category": "分类ID",
  "tags": ["标签1", "标签2"],
  "source": "来源网站",
  "datePublished": "YYYY-MM-DD",
  "language": "en"
}
```

### 3. 提交更新

```
PUT https://api.github.com/repos/idocu1024-lab/OPC123/contents/data/articles.json
Authorization: token YOUR_GITHUB_TOKEN
Content-Type: application/json

{
  "message": "Add article: 文章标题",
  "content": "修改后完整JSON的Base64编码",
  "sha": "步骤1拿到的SHA"
}
```

### 成功响应

```
HTTP 200 OK
```

GitHub Pages 约1分钟后自动更新。

---

## 方式二：通过本地 Flask API 提交（需本地运行服务器）

适用于本地开发调试。需先启动 Flask 服务器：

```bash
cd OPC123
source venv/bin/activate
python server.py
```

### 添加文章

```
POST http://127.0.0.1:8080/api/articles
Content-Type: application/json
```

```json
{
  "title": "文章标题（中文）",
  "url": "https://example.com/article-link",
  "summary": "2-3句中文摘要",
  "category": "getting-started",
  "tags": ["标签1", "标签2"],
  "source": "来源网站",
  "language": "en"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 文章标题，建议中文 |
| `url` | string | 是 | 原文链接，用于去重 |
| `summary` | string | 否 | 中文摘要 |
| `category` | string | 否 | 分类ID，默认 `getting-started` |
| `tags` | string[] | 否 | 标签数组 |
| `source` | string | 否 | 来源网站名 |
| `datePublished` | string | 否 | 文章原始发布日期，格式 `YYYY-MM-DD`，默认今天 |
| `language` | string | 否 | `zh` 或 `en`，默认 `en` |

| 状态码 | 说明 |
|--------|------|
| 201 | 添加成功 |
| 400 | 缺少 title 或 url |
| 409 | URL 已存在 |

> 注意：本地 Flask 添加的文章需手动 `git commit && git push` 才能更新线上。

### 删除文章

```
DELETE http://127.0.0.1:8080/api/articles/{article_id}
```

---

## 分类 ID 对照表

| category ID | 分类名称 | 适用内容 |
|-------------|---------|---------|
| `email-communication` | 📨 邮件与沟通 | 邮件自动化、消息回复、沟通模板 |
| `schedule-tasks` | 📅 日程与任务 | 日历管理、待办事项、自动提醒 |
| `docs-writing` | ✍️ 文档与写作 | 报告生成、内容创作、翻译润色 |
| `data-analysis` | 📊 数据与分析 | 数据整理、报表生成、趋势分析 |
| `customer-sales` | 🤝 客户与销售 | 客服自动化、销售跟进、CRM |
| `marketing` | 📢 营销与推广 | 社交媒体、内容营销、SEO |
| `team-management` | 👥 团队与管理 | 项目管理、会议纪要、知识库 |
| `getting-started` | 💡 入门与技巧 | 快速上手、效率技巧、常见问题 |
