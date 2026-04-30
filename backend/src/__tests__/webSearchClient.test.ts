import { searchWeb } from '../services/webSearchClient';

describe('searchWeb', () => {
  const originalEnv = process.env;
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    global.fetch = mockFetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('queryが空なら空配列を返しfetchしない', async () => {
    process.env.SEARCH_API_KEY = 'dummy';

    const result = await searchWeb('   ');

    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('APIキーがない場合は空配列を返す', async () => {
    delete process.env.SEARCH_API_KEY;

    const result = await searchWeb('stress care');

    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('brave providerのレスポンスを正規化する', async () => {
    process.env.SEARCH_API_KEY = 'dummy';
    process.env.SEARCH_PROVIDER = 'brave';

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        web: {
          results: [
            {
              title: 'Brave Result',
              url: 'https://example.com/brave',
              description: 'snippet',
            },
          ],
        },
      }),
    });

    const result = await searchWeb('stress care');

    expect(result).toEqual([
      {
        title: 'Brave Result',
        url: 'https://example.com/brave',
        snippet: 'snippet',
        source: 'brave',
      },
    ]);
  });

  it('serper providerのレスポンスを正規化する', async () => {
    process.env.SEARCH_API_KEY = 'dummy';
    process.env.SEARCH_PROVIDER = 'serper';

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        organic: [
          {
            title: 'Serper Result',
            link: 'https://example.com/serper',
            snippet: 'snippet',
          },
        ],
      }),
    });

    const result = await searchWeb('stress care');

    expect(result).toEqual([
      {
        title: 'Serper Result',
        url: 'https://example.com/serper',
        snippet: 'snippet',
        source: 'serper',
      },
    ]);
  });

  it('APIレスポンスが非200の場合は空配列を返す', async () => {
    process.env.SEARCH_API_KEY = 'dummy';
    process.env.SEARCH_PROVIDER = 'brave';

    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const result = await searchWeb('stress care');

    expect(result).toEqual([]);
  });
});
