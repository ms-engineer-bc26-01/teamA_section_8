import type { ExternalResult } from './external-result';
import { fetchExternal } from './fetch-util';

/**
 * Web Search クライアントが返す結果アイテム
 *
 * マニュアル 5.3 節に準拠:
 * - title: 検索結果のタイトル
 * - url: 検索結果のURL
 * - snippet: 検索結果の要約（プロンプトインジェクション対策のため要約推奨）
 */
export type SearchResultItem = {
  title: string;
  url: string;
  snippet: string;
};

/**
 * セルフケア向けのダミー検索結果（公的機関中心）
 *
 * マニュアル 10 節「モック切替フラグ」に準拠:
 * - USE_EXTERNAL_API=false の場合に返す固定ダミー
 * - 本番デモ・レート制限・APIキー未取得時のフォールバック用
 *
 * 1件目はクエリを動的に含めることで「検索が動いている」感を演出。
 * 残り4件は信頼できる公的機関・医療メディアの固定情報。
 */
function buildMockResults(query: string): SearchResultItem[] {
  return [
    {
      title: `「${query}」に関するセルフケア情報 | こころの耳`,
      url: 'https://kokoro.mhlw.go.jp/',
      snippet: `${query}に悩んでいる方への情報。専門家が監修したセルフケアのヒントを掲載しています。`,
    },
    {
      title: 'こころの耳：働く人のメンタルヘルス・ポータルサイト | 厚生労働省',
      url: 'https://kokoro.mhlw.go.jp/',
      snippet: 'ストレスや不安など、心の不調に関する情報を分かりやすく解説。セルフケアの方法やリラックス術が学べます。',
    },
    {
      title: 'e-ヘルスネット | 厚生労働省',
      url: 'https://www.e-healthnet.mhlw.go.jp/',
      snippet: '健康的な生活習慣や運動、食事、休養などの情報を提供する公的サイト。心身の健康維持に役立つ情報が満載です。',
    },
    {
      title: '国立精神・神経医療研究センター',
      url: 'https://www.ncnp.go.jp/',
      snippet: '精神疾患や神経疾患に関する研究・情報発信を行う国立センター。専門的なメンタルヘルス情報が確認できます。',
    },
    {
      title: 'みんなのメンタルヘルス | 厚生労働省',
      url: 'https://www.mhlw.go.jp/kokoro/',
      snippet: '心の病気や悩みについて、本人・家族・周囲の人それぞれの立場から分かりやすく解説しています。',
    },
  ];
}

/**
 * Web 検索クライアント
 *
 * - USE_EXTERNAL_API=false の場合: モック結果を返す
 * - USE_EXTERNAL_API=true の場合: Serper API を呼び出して実検索
 *
 * いずれの場合も ExternalResult<SearchResultItem[]> 形式で返却。
 *
 * @param query - 検索クエリ
 * @returns ExternalResult<SearchResultItem[]>
 */
export async function searchWeb(
  query: string
): Promise<ExternalResult<SearchResultItem[]>> {
  // モックモード（マニュアル 10 節に準拠）
  if (process.env.USE_EXTERNAL_API !== 'true') {
    return {
      ok: true,
      data: buildMockResults(query),
      source: 'search.mock',
    };
  }

  // 本番モード: Serper API 呼び出し
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiKey) {
    return { ok: false, error: 'unknown', source: 'search' };
  }

  const url = `https://google.serper.dev/search?q=${encodeURIComponent(query)}&apiKey=${apiKey}`;

  return fetchExternal<SearchResultItem[]>(
    url,
    (raw) => {
      // Serper API のレスポンスを { title, url, snippet }[] に変換
      const data = raw as {
        organic?: Array<{ title: string; link: string; snippet: string }>;
      };
      const results = (data.organic ?? []).slice(0, 5);
      return results.map((r) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet,
      }));
    },
    'search'
  );
}
