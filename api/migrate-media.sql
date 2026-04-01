-- 迁移：添加 media_type 和 media_url 字段
ALTER TABLE posts ADD COLUMN media_type TEXT DEFAULT 'text';
ALTER TABLE posts ADD COLUMN media_url TEXT DEFAULT '';
