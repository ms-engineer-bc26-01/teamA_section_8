# Frontend — 感情トラッキング × AI セルフケアコーチ

React + TypeScript + Vite + Tailwind CSS v3 で構成されたフロントエンドです。

## 技術スタック

| カテゴリ          | ライブラリ   | バージョン | 採用理由                                                      |
| ----------------- | ------------ | ---------- | ------------------------------------------------------------- |
| UI フレームワーク | React        | 19         | Server Components・Actions など最新機能を見据えた選択         |
| 言語              | TypeScript   | 6          | 厳格な型チェックでチーム開発の品質を担保                      |
| ビルドツール      | Vite         | 8          | HMR が高速、設定がシンプル                                    |
| CSS               | Tailwind CSS | **v3**     | v4 はまだ破壊的変更が多くエコシステムが未成熟なため v3 を採用 |
| 状態管理          | Zustand      | -          | 軽量かつ再レンダリング制御が容易なため推奨                    |

> **Tailwind v3 を選んだ理由（補足）**
> Tailwind v4 は設定ファイルの形式・PostCSS プラグインの扱いが大きく変わり、UI ライブラリ（shadcn/ui 等）や VS Code 拡張の対応が追いついていない状態です。チームとして安定した開発体験を優先し、v3 固定としました。

---

## 開発環境の前提条件

- **Node.js: v20 系**
  - Dockerfile (`node:20-bookworm-slim`) とローカル環境を合わせるため、v20系を使用してください。
  - バージョン管理ツール（`nvm` 等）の利用を推奨します（例: `nvm use 20`）。

---

## 起動方法

### 推奨: Docker Compose（全サービス一括起動）

```bash
# リポジトリルートで実行
docker compose up --build
```

| URL                   | 内容                         |
| --------------------- | ---------------------------- |
| http://localhost:80   | Nginx 経由（本番同等・推奨） |
| http://localhost:3000 | Vite dev server 直アクセス   |

> **Windows / Mac で HMR が効かない場合**
> `docker-compose.yml` に `CHOKIDAR_USEPOLLING=true` が設定済みなので、通常は追加作業不要です。

### ローカル単体起動（Docker を使わない場合：UI実装時などに推奨）

```bash
cd frontend
npm install
npm run dev
```

ローカル起動時はバックエンドへの API プロキシが効かないため、`.env.local` で `VITE_API_BASE_URL` を直接バックエンドの URL に向けてください。

```env
# frontend/.env.local（Git 管理外）
VITE_API_BASE_URL=http://localhost:8000
```

---

## 環境変数

| 変数名              | デフォルト値 | 説明                                                                                      |
| ------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `/api`       | バックエンド API のベース URL。Docker 環境では Nginx がプロキシするため `/api` のまま使用 |

---

## ディレクトリ構成

役割を明確に分離するため、以下のアーキテクチャを採用しています。

```text
frontend/
├── public/          # そのまま公開される静的ファイル (favicon等) ※空の場合は .gitkeep を配置
├── src/
│   ├── api/         # APIクライアント (fetch等の通信処理)
│   ├── assets/      # importして使う画像・SVG・フォント等 ※空の場合は .gitkeep を配置
│   ├── components/  # 再利用可能な UI コンポーネント
│   │   ├── chat/    # チャットUI関連
│   │   ├── charts/  # 感情グラフコンポーネント
│   │   └── common/  # 汎用部品（ボタン・モーダル等）
│   ├── constants/   # アプリ全体で使う定数群 (カラーコード、固定文言等)
│   ├── hooks/       # カスタムフック (ロジックの分離)
│   ├── pages/       # 画面（ルーティング）単位のコンポーネント
│   ├── routes/      # ルーティング設定
│   ├── store/       # グローバル状態管理 (Zustand)
│   ├── types/       # TypeScript 型定義
│   ├── utils/       # 共通ユーティリティ関数
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── tailwind.config.js
└── vite.config.ts
```

---

## コーディング規約

- **スタイルは Tailwind クラスのみ使用**（独自 CSS ファイルは原則追加しない）
- グローバルスタイルは `src/index.css` の `@tailwind` ディレクティブのみ
- UI（見た目）とロジック（動き・通信）は分離し、複雑な処理は `src/hooks/` へ切り出す
- 外部アセット（画像等）は `public/` と `src/assets/` の役割を理解して使い分ける

---

## よく使うコマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド（tsc + vite build）
npm run lint     # ESLint 実行
npm run preview  # ビルド成果物のプレビュー
```
