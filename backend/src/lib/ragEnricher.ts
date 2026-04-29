/**
 * RAG連携インターフェース
 *
 * 担当Cは defaultRagEnricher の実装をこのファイル内で差し替えてください。
 * chatController.ts は変更不要です。
 *
 * 実装時の注意:
 * - RagEnricher が返す Promise は reject させないこと（エラー時は空 RagContext を返す）
 * - chatController.ts は常に resolved な Promise を受け取ることを前提としています
 */

export interface RagContext {
  /** システムプロンプトの末尾に追記する補足情報 */
  systemSupplement: string;
  /** ユーザーメッセージ直前に system ロールで挿入する検索結果の断片 */
  retrievedPassages: string[];
}

export type RagEnricher = (
  userMessage: string,
  location?: { lat: number; lng: number },
) => Promise<RagContext>;

export const defaultRagEnricher: RagEnricher = async () => ({
  systemSupplement: '',
  retrievedPassages: [],
});
