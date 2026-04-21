# ==============================================================
# Backend Dockerfile (Node.js + Express + Prisma)
# ------------------------------------------------------------
# 設計意図:
#  - Alpine ではなく debian-slim を採用
#    → bcrypt のネイティブビルド失敗と、Prisma の OpenSSL 問題を両方回避
#  - Node.js はチーム全員で v20 LTS に固定
#  - prisma generate をビルド時に実行
# ==============================================================

FROM node:20-bookworm-slim

# Prisma が動的リンクする OpenSSL を明示的にインストール
# (これが無いと "Unable to require libquery_engine" エラーが出る)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        openssl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依存関係を先にコピーしてレイヤーキャッシュを効かせる
COPY package*.json ./
RUN npm ci

# Prisma スキーマを先にコピーして generate まで済ませる
COPY prisma ./prisma
RUN npx prisma generate

# ソースコードをコピー
COPY . .

EXPOSE 8000

# 開発用: ts-node-dev / tsx などで自動リロード
CMD ["npm", "run", "dev"]
