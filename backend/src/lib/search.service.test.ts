import { searchWeb } from './search.service';

describe('searchWeb (S3-C-03)', () => {
  // 各テストの前に環境変数をリセット
  beforeEach(() => {
    delete process.env.USE_EXTERNAL_API;
    delete process.env.SEARCH_API_KEY;
  });

  describe('モックモード (USE_EXTERNAL_API !== "true")', () => {
    it('USE_EXTERNAL_API が未設定のとき ok: true を返す', async () => {
      const result = await searchWeb('眠れない');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.source).toBe('search.mock');
      }
    });

    it('USE_EXTERNAL_API が "false" のとき ok: true を返す', async () => {
      process.env.USE_EXTERNAL_API = 'false';
      const result = await searchWeb('ストレス');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.source).toBe('search.mock');
      }
    });

    it('返却データは最大5件 (マニュアル5.3節準拠)', async () => {
      const result = await searchWeb('不安');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.length).toBeLessThanOrEqual(5);
      }
    });

    it('各アイテムが title / url / snippet を持つ (マニュアル5.3節準拠)', async () => {
      const result = await searchWeb('疲れた');

      expect(result.ok).toBe(true);
      if (result.ok) {
        for (const item of result.data) {
          expect(typeof item.title).toBe('string');
          expect(typeof item.url).toBe('string');
          expect(typeof item.snippet).toBe('string');
        }
      }
    });

    it('1件目のタイトルにクエリが含まれる (デモ用に動的反映)', async () => {
      const query = 'うつ';
      const result = await searchWeb(query);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data[0].title).toContain(query);
      }
    });
  });

  describe('本番モード (USE_EXTERNAL_API === "true")', () => {
    it('SEARCH_API_KEY が未設定のとき ok: false / error: unknown を返す', async () => {
      process.env.USE_EXTERNAL_API = 'true';
      // SEARCH_API_KEY は未設定のまま

      const result = await searchWeb('test');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('unknown');
        expect(result.source).toBe('search');
      }
    });
  });

  describe('返却型 (ExternalResult)', () => {
    it('ok / rate_limit / timeout のいずれかの形に必ずなる', async () => {
      const result = await searchWeb('テスト');

      // 型ガード確認: ok か !ok のどちらかで絞り込める
      if (result.ok) {
        expect(result.data).toBeDefined();
        expect(result.source).toBeDefined();
      } else {
        expect(['rate_limit', 'timeout', 'unknown']).toContain(result.error);
        expect(result.source).toBeDefined();
      }
    });
  });
});
