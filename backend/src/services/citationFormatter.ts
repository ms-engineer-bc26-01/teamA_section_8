import { WebSearchResult } from './webSearchClient';

export function formatReplyWithCitations(content: string, sources: WebSearchResult[]): string {
  const base = content.trim();
  if (!sources.length) {
    return base;
  }

  const uniqueSources = Array.from(
    new Map(
      sources
        .filter((source) => source.title && source.url)
        .map((source) => [source.url, source]),
    ).values(),
  );

  if (!uniqueSources.length) {
    return base;
  }

  const lines = uniqueSources.map(
    (source, index) => `${index + 1}. ${source.title} (${source.url})`,
  );

  return `${base}\n\n出典:\n${lines.join('\n')}`;
}
