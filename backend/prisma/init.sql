-- ==============================================================
-- PostgreSQL 初期化スクリプト
-- db サービス起動時に /docker-entrypoint-initdb.d/ 経由で自動実行
-- ==============================================================

-- gen_random_uuid() を使うために必要
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- タイムゾーン設定の明示(保険)
SET TIME ZONE 'Asia/Tokyo';
