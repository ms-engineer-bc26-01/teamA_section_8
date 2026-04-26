import { fetchExternal } from './fetch-util';

describe('fetchExternal', () => {
  // 各テストの後に fetch のモックをリセット
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('成功時', () => {
    it('正常レスポンスから items を取得できる', async () => {
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
          return d.results;
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.items).toHaveLength(1);
        expect(result.items[0].name).toBe('カフェ');
      }
    });
  });

  describe('失敗時', () => {
    it('HTTPエラー (500) のリトライ後に最終的に失敗する', async () => {
      // 全試行で 500 を返す
      const mockResponse = { ok: false, status: 500 };
      jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse as Response);

      const result = await fetchExternal<{ id: string }>(
        'https://example.com/api',
        () => []
      );

      expect(result.ok).toBe(false);
      expect(result.items).toEqual([]);
    });

    it('ネットワークエラーのリトライ後に最終的に失敗する', async () => {
      // 全試行でエラーを投げる
      jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      const result = await fetchExternal<{ id: string }>(
        'https://example.com/api',
        () => []
      );

      expect(result.ok).toBe(false);
      expect(result.items).toEqual([]);
    });
  });

  describe('オプション', () => {
    it('retryCount: 0 の場合は1回のみ試行する', async () => {
      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockRejectedValue(new Error('Network error'));

      await fetchExternal<{ id: string }>(
        'https://example.com/api',
        () => [],
        { retryCount: 0 }
      );

      // 初回1回のみ呼ばれる（リトライなし）
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });
});
