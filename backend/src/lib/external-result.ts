/**
 * 外部API呼び出しの結果を表す型
 *
 * 外部API（Google Maps, Connpass API, Web検索API, OpenWeatherMap など）
 * の呼び出しが成功・失敗どちらであるかを統一的に表現する。
 *
 * 成功時: data に結果データ、cached でキャッシュヒット可否、source でAPI識別
 * 失敗時: error でエラー種別（rate_limit/timeout/unknown）、source でAPI識別
 *
 * 例外を投げず常にこの型を返すことで、呼び出し側のエラーハンドリングを簡潔にする。
 */
export type ExternalResult<T> =
  | { ok: true; data: T; cached?: boolean; source: string }
  | { ok: false; error: 'rate_limit' | 'timeout' | 'unknown'; source: string };
