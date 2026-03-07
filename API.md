# OpenClaw ABC API 接口文档

> 供 OpenClaw 调用，将分析后的文章数据推送到 OpenClaw ABC 网站。

## 基础信息

| 项目 | 值 |
|------|------|
| 基础地址 | `http://127.0.0.1:8080` |
| 数据格式 | JSON |
| 编码 | UTF-8 |

---

## 1. 添加文章

OpenClaw 分析完链接后，调用此接口将文章数据推送到网站。

### 请求

```
POST /api/articles
Content-Type: application/json
```

### 请求体

```json
{
  "title": "文章标题（中文）",
  "url": "https://example.com/article-link",
  "summary": "2-3句中文摘要，面向职场人士和中小企业主，突出实用价值",
  "category": "getting-started",
  "tags": ["标签1", "标签2"],
  "source": "来源网站名称",
  "language": "en"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 文章标题，建议翻译为中文 |
| `url` | string | 是 | 文章原始链接，用于去重和跳转 |
| `summary` | string | 否 | 中文摘要，2-3句话，重点描述对职场人士/企业的实用价值 |
| `category` | string | 否 | 分类ID（见下方分类表），默认 `getting-started` |
| `tags` | string[] | 否 | 标签数组，建议2-5个中文标签 |
| `source` | string | 否 | 来源网站名（如 "Medium"、"Towards AI"） |
| `language` | string | 否 | 原文语言，`zh` 中文 / `en` 英文，默认 `en` |

### 分类 ID 对照表

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

### 成功响应

```
HTTP 201 Created
```

```json
{
  "ok": true,
  "article": {
    "id": "art-98e5657d",
    "title": "文章标题",
    "url": "https://...",
    "summary": "...",
    "category": "getting-started",
    "tags": ["标签1", "标签2"],
    "source": "Medium",
    "dateAdded": "2026-03-08",
    "language": "en"
  }
}
```

### 错误响应

| 状态码 | 场景 | 响应体 |
|--------|------|--------|
| 400 | 缺少 title 或 url | `{"error": "title and url are required"}` |
| 400 | 请求体不是 JSON | `{"error": "JSON body required"}` |
| 409 | URL 已存在（重复添加） | `{"error": "Article with this URL already exists"}` |

---

## 2. 删除文章

```
DELETE /api/articles/{article_id}
```

### 成功响应

```
HTTP 200 OK
```

```json
{
  "ok": true
}
```

### 错误响应

| 状态码 | 场景 | 响应体 |
|--------|------|--------|
| 404 | 文章不存在 | `{"error": "Article not found"}` |

---

## 3. 获取所有文章

```
GET /data/articles.json
```

返回完整的分类和文章数据，供前端渲染。

---

## OpenClaw 调用示例

OpenClaw 收到用户发来的链接后，应执行以下步骤：

1. **抓取链接内容**，阅读文章
2. **生成中文摘要**（2-3句，突出对职场人士/企业的实用价值）
3. **选择分类**（从上方8个分类中选最匹配的一个）
4. **提取标签**（2-5个中文关键词）
5. **POST 到 API**

### curl 示例

```bash
curl -X POST http://127.0.0.1:8080/api/articles \
  -H "Content-Type: application/json" \
  -d '{
    "title": "用 OpenClaw 让你的日报周报自动生成",
    "url": "https://example.com/auto-report",
    "summary": "介绍如何配置 OpenClaw 自动汇总每日工作记录，一键生成日报和周报。管理者也可以用它自动汇总团队工作进展，节省大量整理时间。",
    "category": "docs-writing",
    "tags": ["日报", "周报", "自动生成", "效率"],
    "source": "Example Blog",
    "language": "zh"
  }'
```
