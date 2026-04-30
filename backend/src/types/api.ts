import type { ChatMessageResponse as ChatMessage, ChatSource } from './chat';

/**
 * API型定義 — 感情トラッキング × AIセルフケアコーチ
 *
 * @version 1.1.0 (Sprint 1 完了時点)
 * @see Notion「📖 API仕様」が常に最新の正
 *
 * ■ このファイルの使い方（メンバーB向け）
 *   backend/src/types/api.ts をそのままコピーして
 *   frontend/src/types/api.ts に置くだけで使えます。
 *   インポートは一切不要なので、将来の shared-types パッケージ化も容易です。
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ■ API契約たたき台(v0.1 Draft)からの変更点まとめ
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 【認証方式】
 *   たたき台 → Authorization: Bearer <token> (localStorage想定)
 *   確定版   → httpOnly Cookie (name: "token") を使用
 *
 *   フロント側で必要な対応:
 *     fetch:  credentials: 'include' を全APIリクエストに付ける
 *     axios:  axios.defaults.withCredentials = true をグローバル設定
 *     トークンをlocalStorageに保存する処理は不要（Cookieが自動で送られる）
 *     Authorizationヘッダーを手動でセットする処理も不要
 *
 * 【フィールド名のケース】
 *   たたき台 → display_name, conversation_id, created_at（スネークケース）
 *   確定版   → displayName, conversationId, createdAt（キャメルケース）
 *   ※ DB（Prisma）内部はスネークケースだが、APIレスポンスはキャメルケースに統一
 *
 * 【tokenのレスポンス位置】
 *   たたき台 → レスポンスBodyに { token: "eyJ..." } を含める
 *   確定版   → Set-Cookie ヘッダーでhttpOnly Cookieとして自動セット
 *              BodyにはUserオブジェクトのみを返す
 *
 * 【エラーレスポンス形式】
 *   たたき台 → { "error": "メッセージ文字列" }
 *   確定版   → { "error": { "code": "ERROR_CODE", "message": "..." } }
 *              ※ code でフロントのエラーハンドリングを分岐できる
 *
 * 【エンドポイント構成の変更】
 *   たたき台 → /api/chat/history（会話履歴）
 *   確定版   → /api/conversations（会話セッション管理）に変更
 *              チャット本体の /api/chat/* はSprint 2で別途追加予定
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ■ MSWモックを作るときの注意点（メンバーB向け）
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   // MSWハンドラの例（Cookie認証のシミュレーション）
 *   http.post('/api/auth/login', () => {
 *     return HttpResponse.json(
 *       { user: { id: 'uuid-1', email: 'test@example.com', displayName: 'テスト' } },
 *       {
 *         status: 200,
 *         headers: {
 *           // ブラウザはhttpOnly Cookieを直接読めないが、
 *           // MSW環境ではこのヘッダーをセットしてCookieをシミュレートする
 *           'Set-Cookie': 'token=mock-jwt-token; HttpOnly; Path=/',
 *         },
 *       }
 *     );
 *   }),
 *
 *   // 認証が必要なエンドポイントのモック
 *   http.get('/api/conversations', ({ cookies }) => {
 *     // cookies.token が undefined なら 401 を返す
 *     if (!cookies.token) {
 *       return HttpResponse.json(
 *         { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
 *         { status: 401 }
 *       );
 *     }
 *     return HttpResponse.json({ conversations: [], nextCursor: null });
 *   }),
 */

// ═══════════════════════════════════════════════════════════════════════════
// 共通型：エラー
// ═══════════════════════════════════════════════════════════════════════════

/**
 * APIエラーコード一覧
 *
 * フロントでの使い方:
 *   if (error.code === 'EMAIL_EXISTS') { ... }
 *   if (error.code === 'UNAUTHORIZED') { router.push('/login') }
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'     // 400: 入力値の形式エラー
  | 'INVALID_CREDENTIALS'  // 401: メアド・パスワード不一致
  | 'UNAUTHORIZED'         // 401: 未ログイン（Cookieなし・期限切れ）
  | 'FORBIDDEN'            // 403: 他ユーザーのリソースへのアクセス
  | 'NOT_FOUND'            // 404: 対象リソースが存在しない
  | 'EMAIL_EXISTS'         // 409: 登録済みメールアドレス
  | 'INTERNAL_ERROR';      // 500: サーバー内部エラー

/**
 * 全エンドポイント共通のエラーレスポンス形式
 *
 * ⚠️ たたき台の { "error": "文字列" } から変更になりました
 *
 * @example
 *   // axiosのinterceptorでの処理例
 *   const { code } = (error.response.data as ApiError).error;
 *   if (code === 'UNAUTHORIZED') router.push('/login');
 */
export interface ApiError {
  error: {
    code: ErrorCode;
    message: string; // ユーザー向けの日本語メッセージ
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 共通型：ユーザー
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ フィールド名注意: たたき台の display_name → displayName に変更
 */
export interface UserPublic {
  id: string;          // UUID v4
  email: string;
  displayName: string; // ⚠️ スネークケースではありません
}

/** register時のみ createdAt が付く */
export interface UserPublicWithTimestamp extends UserPublic {
  createdAt: string; // ISO 8601 UTC 例: "2026-04-21T10:00:00.000Z"
}

// ═══════════════════════════════════════════════════════════════════════════
// Sprint 1 実装済み：認証エンドポイント
// ═══════════════════════════════════════════════════════════════════════════

// ── POST /api/auth/register ──────────────────────────────────────────────
//
// 成功時: 201 Created
//   - Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Path=/
//   - Body: { user: UserPublicWithTimestamp }
//
// ⚠️ たたき台との差分:
//   - tokenはBodyではなくCookieで返ります（Bodyにtokenフィールドはありません）
//   - display_name → displayName
//
// エラー:
//   - 400 VALIDATION_ERROR（形式不正・パスワード8文字未満）
//   - 409 EMAIL_EXISTS（登録済みメールアドレス）

export interface RegisterRequestBody {
  email: string;
  password: string;    // 8文字以上（サーバー側でzodでチェック）
  displayName: string; // 1〜100文字（⚠️ display_name ではありません）
}

export interface RegisterResponseBody {
  user: UserPublicWithTimestamp;
  // ⚠️ token フィールドはありません。CookieをSet-Cookieヘッダーで受け取ります。
}

// ── POST /api/auth/login ─────────────────────────────────────────────────
//
// 成功時: 200 OK
//   - Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Path=/
//   - Body: { user: UserPublic }
//
// ⚠️ たたき台との差分:
//   - tokenはBodyではなくCookieで返ります
//   - display_name → displayName
//
// エラー:
//   - 400 VALIDATION_ERROR
//   - 401 INVALID_CREDENTIALS

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface LoginResponseBody {
  user: UserPublic;
  // ⚠️ token フィールドはありません
}

// ── POST /api/auth/logout ────────────────────────────────────────────────
//
// 成功時: 200 OK
//   - Cookieをクリアする（Set-Cookie: token=; Max-Age=0）
//   - Body: { message: string }
//
// ⚠️ たたき台にはなかったエンドポイントです

export interface LogoutResponseBody {
  message: string; // "ログアウトしました"
}

// ═══════════════════════════════════════════════════════════════════════════
// Sprint 1 実装済み：会話セッション管理
//
// ⚠️ たたき台との差分：
//   たたき台の /api/chat/history（会話履歴）とは別物です。
//   こちらは「会話セッション」の管理（一覧・作成・削除）を担います。
//   チャットメッセージ本体（送信・受信）は Sprint 2 の /api/chat/* で実装予定。
// ═══════════════════════════════════════════════════════════════════════════

export interface Conversation {
  id: string;            // UUID v4
  startedAt: string;     // ISO 8601 UTC
  lastMessageAt: string; // ISO 8601 UTC
}

// ── GET /api/conversations ───────────────────────────────────────────────
//
// 認証: Cookie必須（401 UNAUTHORIZEDが返る場合はログイン画面へ）
//
// クエリパラメータ:
//   cursor: ISO 8601 datetime。この値より古いlastMessageAtの会話を取得。
//           省略時は最新から取得。
//   limit:  取得件数 1〜100、デフォルト20。
//
// 成功時: 200 OK
// エラー:
//   - 400 VALIDATION_ERROR（cursorの形式不正）
//   - 401 UNAUTHORIZED

export interface ListConversationsQuery {
  cursor?: string; // ISO 8601 datetime
  limit?: number;  // デフォルト20
}

export interface ListConversationsResponseBody {
  conversations: Conversation[];
  nextCursor: string | null; // null = 最終ページ（has_moreは使いません）
}

// ── POST /api/conversations ──────────────────────────────────────────────
//
// 認証: Cookie必須
// リクエストBody: なし
// 成功時: 201 Created
// エラー:
//   - 401 UNAUTHORIZED

export interface CreateConversationResponseBody {
  conversation: Conversation;
}

// ── PUT /api/conversations/:id ───────────────────────────────────────────
//
// 認証: Cookie必須
// リクエストBody: なし（サーバー側でlastMessageAtを現在時刻に更新する）
// 成功時: 200 OK
// エラー:
//   - 401 UNAUTHORIZED
//   - 403 FORBIDDEN（他ユーザーの会話）
//   - 404 NOT_FOUND

export interface UpdateConversationResponseBody {
  conversation: Conversation;
}

// ── DELETE /api/conversations/:id ────────────────────────────────────────
//
// 認証: Cookie必須
// 成功時: 204 No Content（BodyなしでResponseが返る。response.json()を呼ばないこと）
// エラー:
//   - 401 UNAUTHORIZED
//   - 403 FORBIDDEN
//   - 404 NOT_FOUND

// ═══════════════════════════════════════════════════════════════════════════
// Sprint 2 実装済み：チャット・感情スコア
// ═══════════════════════════════════════════════════════════════════════════

/** 感情ラベル */
export type EmotionLabel = 'joy' | 'sadness' | 'anger' | 'fear' | 'neutral';

/**
 * メッセージに付与される感情スコア
 * OpenAI function callingで抽出する
 */
export interface EmotionScore {
  label: EmotionLabel;
  score: number;      // -1.0〜1.0
  categories: string[]; // 例: ["疲労", "ストレス"]
}

// ── POST /api/chat ─────────────────────────────────────────────────────────
// 会話作成（Bodyなし）
export interface CreateChatResponseBody {
  conversation: Conversation;
}

// ── POST /api/chat/:id/message ─────────────────────────────────────────────

export interface SendMessageRequestBody {
  content: string;           // ユーザーのメッセージ本文
  location?: {
    lat: number;
    lng: number;
  };
}

export interface AssistantMessage {
  id: string;          // UUID v4
  role: 'assistant';
  content: string;
  emotionScore: EmotionScore | null;
  createdAt: string;   // ISO 8601 UTC
}

export interface SendMessageResponseBody {
  message: ChatMessage;
}

// ── GET /api/chat/:id/history ──────────────────────────────────────────────
export interface ChatHistoryResponseBody {
  messages: ChatMessage[];
}

// ── GET /api/emotions/trend（Sprint 2 実装予定）──────────────────────────
//
// たたき台とほぼ同じ仕様です

export interface EmotionTrendQuery {
  range: 'week' | 'month';
}

export interface EmotionTrendPoint {
  date: string;              // "YYYY-MM-DD"
  dominantEmotion: EmotionLabel;
  sentimentScore: number;    // -1.0〜1.0
  summary: string | null;    // AIが生成した一言サマリ
}

export interface EmotionTrendResponseBody {
  points: EmotionTrendPoint[];
  // 空データ時は points: [] で返ります（フロントは「データがありません」を表示）
}

// ═══════════════════════════════════════════════════════════════════════════
// Sprint 3 実装予定（未実装）：提案系エンドポイント
// ═══════════════════════════════════════════════════════════════════════════

// たたき台の /api/suggestions/* に相当します（構造は変更なし予定）

export type SuggestionType = 'place' | 'event' | 'content';

export interface SuggestionItem {
  id: string;
  name: string;
  description: string;
  type: SuggestionType;
  url?: string;
}

export interface SuggestionsResponseBody {
  ok: boolean;
  items: SuggestionItem[];
  // ok: false の場合は外部APIが失敗。items: [] でフォールバック。
  // フロントは「現在提案を取得できません」と表示（エラー扱いにしない）
}

// ═══════════════════════════════════════════════════════════════════════════
// ユーティリティ：ヘルスチェック
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/health（認証不要）
export interface HealthResponseBody {
  status: 'ok';
}
