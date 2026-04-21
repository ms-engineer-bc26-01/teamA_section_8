# ==============================================================
# Frontend Dockerfile (React + Vite + TypeScript / PWA)
# ------------------------------------------------------------
# 設計意図:
#  - Vite dev server を 0.0.0.0 でバインドしてコンテナ外からアクセス可に
#  - debian-slim で OS 差異を減らす
# ==============================================================

FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# --host 0.0.0.0 が無いと nginx/ブラウザから繋がらない
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
