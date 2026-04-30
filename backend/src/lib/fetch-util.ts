import type { ExternalResult } from './external-result';

/**
 * 共通 fetch util のオプション
 */
export type FetchUtilOptions = {
  /** タイムアウト（ミリ秒）。デフォルト: 5000ms */
  timeoutMs?: number;
  /** リトライ回数。デフォルト: 2 */
  retryCount?: number;
};

/**
 * 外部API呼び出しの共通ユーティリティ
 *
 * - 指定時間でタイムアウト
 * - 失敗時に指定回数までリトライ
 * - 最終的に失敗した場合は例外を投げず ExternalResult<T> の失敗形を返す
 *
 * @param url - 取得先URL
 * @param mapToData - レスポンス（unknown）を T 型に変換する関数
 * @param source - データ提供元の識別子（例: 'maps', 'connpass', 'weather'）
 * @param options - timeout/retry の設定
 * @returns ExternalResult<T>
 */
export async function fetchExternal<T>(
  url: string,
  mapToData: (data: unknown) => T,
  source: string,
  options: FetchUtilOptions = {}
): Promise<ExternalResult<T>> {
  const timeoutMs = options.timeoutMs ?? 5000;
  const retryCount = options.retryCount ?? 2;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // レート制限（429）は専用エラーで返す
        if (response.status === 429) {
          return { ok: false, error: 'rate_limit', source };
        }
        // その他のHTTPエラー（4xx, 5xx）はリトライ対象
        continue;
      }

      const rawData: unknown = await response.json();
      const data = mapToData(rawData);
      return { ok: true, data, source };
    } catch {
      clearTimeout(timeoutId);
      // タイムアウト or ネットワークエラー → 次のリトライへ
      continue;
    }
  }

  // 全試行が失敗した場合
  return { ok: false, error: 'timeout', source };
}
