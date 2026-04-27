# teamA_section_8 — セットアップ設定ファイル一式

teamA_感情トラッキング × AIセルフケアコーチアプリ開発課題

このフォルダは Sprint 0 で配置する推奨設定ファイル群です。マニュアルで予測した事故を未然に防ぐことを目的としています。

## ファイル構成

```
setup-configs/
├── docker-compose.yml          # Docker オーケストレーション(bind mount事故対策済み)
├── .env.example                # 環境変数テンプレート
├── backend/
│   ├── Dockerfile              # Node.js 20 + debian-slim(bcrypt/Prisma 安定構成)
│   └── prisma/
│       ├── schema.prisma       # binaryTargets 指定済みスキーマ
│       └── init.sql            # pgcrypto 拡張を自動有効化
├── frontend/
│   └── Dockerfile              # Vite --host 0.0.0.0 対応
└── nginx/
    └── nginx.conf              # /api プロキシ + HMR WebSocket + SSE対応
```

## 設計上の3大ポイント(マニュアルで予測したリスクへの対応)

### 1. bcrypt 互換性エラーの回避

**推奨方針: `bcrypt` ではなく `bcryptjs` を採用してください。**

`package.json` (backend) に以下を追加:

```jsonc
{
  "dependencies": {
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6"
  }
}
```

使用例:

```typescript
import bcrypt from 'bcryptjs';

// ハッシュ化
const hash = await bcrypt.hash(password, 10);

// 検証
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**どうしても `bcrypt`(native) を使う場合**は、ホスト側で `npm install` しても Docker 側の匿名ボリュームで `node_modules` を保護する構成(本 `docker-compose.yml` で対応済み)なら事故りません。追加で Dockerfile に以下を入れます:

```dockerfile
RUN apt-get install -y python3 make g++
```

### 2. Docker の node_modules bind mount 事故

`docker-compose.yml` の `volumes:` で **匿名ボリューム `- /app/node_modules`** をソースマウントの後に宣言することで、ホスト側の `node_modules` がコンテナ内を上書きするのを防いでいます。

```yaml
volumes:
  - ./backend:/app           # ソースをマウント
  - /app/node_modules        # ← この1行でネイティブモジュール事故を防止
```

新しいパッケージを追加した時は `docker compose build backend` で再ビルドしてください。

### 3. Prisma の binaryTargets

`schema.prisma` で 3 つのターゲットを指定しています:

```prisma
binaryTargets = ["native", "debian-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
```

- `native`: 開発者ローカル(Mac/Win/Linux)用
- `debian-openssl-3.0.x`: 推奨 Docker イメージ (`node:20-bookworm-slim`) 用
- `linux-musl-openssl-3.0.x`: Alpine を使いたくなった時の保険

これでローカルでも Docker でも `Unable to require libquery_engine` エラーが出なくなります。

## その他の安全装置

| 箇所 | 何をしているか | 防いでいる事故 |
|------|---------------|--------------|
| `db.healthcheck` | `pg_isready` で DB 準備完了を待つ | backend が DB 未起動時に落ちるのを防止 |
| `CHOKIDAR_USEPOLLING=true` | Vite/nodemon のファイル監視をポーリング | Mac/Win Docker で HMR が効かない問題 |
| `CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]` | Vite を全インターフェースでバインド | nginx/ブラウザから繋がらない問題 |
| `TZ=Asia/Tokyo` + `@db.Timestamptz(6)` | UTC保存・JST表示の統一 | 日付計算のズレ |
| `CREATE EXTENSION pgcrypto` | UUID 生成に必要 | `gen_random_uuid()` が存在しないエラー |
| `proxy_buffering off` | SSE/streaming を通す | OpenAI streaming レスポンスが届かない |
| `Upgrade/Connection` ヘッダ | WebSocket を通す | Vite HMR が切断される |
| `RATE_LIMIT_*` | チャットAPIに rate limit を必須化 | OpenAI コスト暴発 |
| `CHAT_HISTORY_MESSAGE_LIMIT=10` | 会話履歴を直近10件に制限 | トークン超過エラー |

## 配置手順(Sprint 0・担当 1 名が作業 → チームでレビュー)

1. リポジトリルートに `docker-compose.yml`, `.env.example`, `.gitignore`(`.env` を含む) をコピー
2. `backend/Dockerfile`, `backend/prisma/schema.prisma`, `backend/prisma/init.sql` を配置
3. `frontend/Dockerfile` を配置
4. `nginx/nginx.conf` を配置
5. 配置 PR は**他メンバー2名の Approve を取得**してから `main` にマージする
6. 各自 `cp .env.example .env` で自分用の環境変数ファイルを作成(API キー本体は **メンバーC から DM で受領**)
7. `docker compose up --build` で起動確認
8. `docker compose exec backend npx prisma migrate dev --name init` で初回マイグレーション
9. `http://localhost/` (nginx経由) と `http://localhost:3000/` (直接) の両方が開くことを確認

## よく聞かれる質問

**Q. Alpine のほうが軽くないですか?**
A. 軽いですが、bcrypt のネイティブビルドや Prisma の OpenSSL 問題で詰まる確率が上がります。学習コストが見合わないので debian-slim を推奨します。どうしても使う場合は `binaryTargets` に `linux-musl-openssl-3.0.x` を入れる、`apk add python3 make g++ openssl` を入れる、などの追加対応が必要です。

**Q. `httpOnly Cookie` と `localStorage`、どちらで JWT を保存すべき?**
A. 今回の構成は Nginx で同一オリジンに束ねているので、`httpOnly Cookie` のほうが XSS に強く設定も難しくありません。推奨は Cookie 方式。`SameSite=Lax; Secure` を付けます(ローカルは `Secure` 外す)。

**Q. `.env` を Docker ビルドに取り込むべき?**
A. しないでください。`env_file:` で**実行時に**渡すのが正解です。ビルド時に焼き込むとイメージにキーが埋まり、共有時の事故リスクが上がります。
