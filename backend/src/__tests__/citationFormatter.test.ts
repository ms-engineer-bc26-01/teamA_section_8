import { formatReplyWithCitations } from '../services/citationFormatter';

describe('formatReplyWithCitations', () => {
  it('sourcesが空なら本文だけを返す', () => {
    expect(formatReplyWithCitations('本文', [])).toBe('本文');
  });

  it('sourcesがある場合は出典を末尾に付与する', () => {
    const result = formatReplyWithCitations('本文', [
      { title: 'Source A', url: 'https://example.com/a', snippet: 'a' },
      { title: 'Source B', url: 'https://example.com/b', snippet: 'b' },
    ]);

    expect(result).toContain('本文');
    expect(result).toContain('出典:');
    expect(result).toContain('1. Source A (https://example.com/a)');
    expect(result).toContain('2. Source B (https://example.com/b)');
  });

  it('同一URLは重複除去する', () => {
    const result = formatReplyWithCitations('本文', [
      { title: 'Source A', url: 'https://example.com/a', snippet: 'a' },
      { title: 'Source A duplicate', url: 'https://example.com/a', snippet: 'a2' },
    ]);

    const citationLines = result.split('\n').filter((line) => /^\d+\./.test(line));
    expect(citationLines).toHaveLength(1);
    expect(citationLines[0]).toContain('Source A');
  });
});
