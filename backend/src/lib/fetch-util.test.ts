import { fetchExternal } from './fetch-util';

describe('fetchExternal', () => {
  // 各テストの後に fetch のモックをリセット
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('成功時', () => {
    it('正常レスポンスから data を取得できる', async () => {
      // fetch をモック化
      const mockResponse = {
        ok: true,
        json: async () => ({ results: [{ id: '1', name: 'カフェ' }] }),
      };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

      const result = await fetchExternal<{ id: string; name: string }>(
        'https://example.com/api',
        (data) => {
          const d = data as { results: { id: string; name: string }[] };
          return d.results[0];
        },
        'maps'
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('カフェ');
        expect(result.source).toBe('maps');
      }
    });
  });

  describe('失敗時', () => {
    it('HTTPエラー (500) のリトライ後に最終的に失敗する (error: timeout)', async () => {
      // 全試行で 500 を返す
      const mockResponse = { ok: false, status: 500 };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

      const result = await fetchExternal<{ id: string }>(
        'https://example.com/api',
        (data) => data as { id: string },
        'maps'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('timeout');
        expect(result.source).toBe('maps');
      }
    });

    it('HTTPエラー (429) はリトライせず即 rate_limit エラーを返す', async () => {
      const mockResponse = { ok: false, status: 429 };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

      const result = await fetchExternal<{ id: string }>(
        'https://example.com/api',
        (data) => data as { id: string },
        'connpass'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('rate_limit');
        expect(result.source).toBe('connpass');
      }
    });

    it('ネットワークエラーのリトライ後に最終的に失敗する (error: timeout)', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      const result = await fetchExternal<{ id: string }>(
        'https://example.com/api',
        (data) => data as { id: string },
        'weather'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('timeout');
        expect(result.source).toBe('weather');
      }
    });
  });

  describe('オプション', () => {
    it('retryCount: 0 の場合は 1回のみ試行する', async () => {
      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      await fetchExternal<{ id: string }>(
        'https://example.com/api',
        (data) => data as { id: string },
        'maps',
        { retryCount: 0 }
      );

      // 初回1回のみ呼ばれる（リトライなし）
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('retryCount: 2 の場合は 3回試行する（初回 + リトライ2回）', async () => {
      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      await fetchExternal<{ id: string }>(
        'https://example.com/api',
        (data) => data as { id: string },
        'maps',
        { retryCount: 2 }
      );

      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
  });
});
