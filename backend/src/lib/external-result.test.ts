import type { ExternalResult } from './external-result';

describe('ExternalResult<T>', () => {
  describe('成功時 (ok: true)', () => {
    it('items が配列として扱える', () => {
      const result: ExternalResult<{ id: string; name: string }> = {
        ok: true,
        items: [
          { id: '1', name: '代々木公園' },
          { id: '2', name: '新宿御苑' },
        ],
      };

      expect(result.ok).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('代々木公園');
    });

    it('items が空配列でも ok: true を維持できる', () => {
      const result: ExternalResult<{ id: string }> = {
        ok: true,
        items: [],
      };

      expect(result.ok).toBe(true);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('失敗時 (ok: false)', () => {
    it('items は必ず空配列', () => {
      const result: ExternalResult<{ id: string; name: string }> = {
        ok: false,
        items: [],
      };

      expect(result.ok).toBe(false);
      expect(result.items).toHaveLength(0);
    });
  });

  describe('型ガードによる絞り込み', () => {
    it('if (result.ok) で成功時の型に絞り込める', () => {
      const result: ExternalResult<{ id: string; name: string }> = {
        ok: true,
        items: [{ id: '1', name: 'テスト' }],
      };

      if (result.ok) {
        // この分岐内では result.items は { id: string; name: string }[] 型
        expect(result.items[0].name).toBe('テスト');
      } else {
        // ここには到達しないはず
        throw new Error('成功時の分岐に入るはず');
      }
    });
  });
});
