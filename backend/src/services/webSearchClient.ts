export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

type SearchProvider = 'brave' | 'serper';

function getProvider(): SearchProvider {
  const provider = (process.env.SEARCH_PROVIDER ?? 'brave').toLowerCase();
  return provider === 'serper' ? 'serper' : 'brave';
}

async function withTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseBraveResponse(data: unknown): WebSearchResult[] {
  const web = (data as { web?: { results?: unknown[] } })?.web;
  if (!web?.results || !Array.isArray(web.results)) {
    return [];
  }

  return web.results
    .map((item) => {
      const candidate = item as Record<string, unknown>;
      return {
        title: toSafeString(candidate.title),
        url: toSafeString(candidate.url),
        snippet: toSafeString(candidate.description),
        source: 'brave',
      };
    })
    .filter((item) => item.title && item.url);
}

function parseSerperResponse(data: unknown): WebSearchResult[] {
  const organic = (data as { organic?: unknown[] })?.organic;
  if (!organic || !Array.isArray(organic)) {
    return [];
  }

  return organic
    .map((item) => {
      const candidate = item as Record<string, unknown>;
      return {
        title: toSafeString(candidate.title),
        url: toSafeString(candidate.link),
        snippet: toSafeString(candidate.snippet),
        source: 'serper',
      };
    })
    .filter((item) => item.title && item.url);
}

export async function searchWeb(query: string, limit = 5): Promise<WebSearchResult[]> {
  const apiKey = process.env.SEARCH_API_KEY;
  if (!apiKey || !query.trim()) {
    return [];
  }

  const provider = getProvider();

  try {
    if (provider === 'serper') {
      const response = await withTimeout('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify({ q: query, num: Math.max(1, Math.min(limit, 10)) }),
      });

      if (!response.ok) {
        return [];
      }

      const payload = (await response.json()) as unknown;
      return parseSerperResponse(payload).slice(0, limit);
    }

    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(Math.max(1, Math.min(limit, 20))));

    const response = await withTimeout(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': apiKey,
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as unknown;
    return parseBraveResponse(payload).slice(0, limit);
  } catch {
    return [];
  }
}
