/**
 * 外部API呼び出しの結果を表す型
 *
 * 外部API（Google Maps, イベントAPI, Web検索API など）の呼び出しが
 * 成功・失敗のいずれかであることを統一的に表現する。
 *
 * 失敗時は例外を投げず、items を空配列にして返すことで、
 * エンドポイント側のエラーハンドリングを簡潔にする。
 */
export type ExternalResult<T> =
  | { ok: true; items: T[] }
  | { ok: false; items: [] };
  