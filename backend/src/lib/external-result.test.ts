import type { ExternalResult } from './external-result';

describe('ExternalResult<T>', () => {
  describe('成功時 (ok: true)', () => {
    it('data に T 型のオブジェクトを保持できる', () => {
      const result: ExternalResult<{ id: string; name: string }> = {
        ok: true,
        data: { id: '1', name: '代々木公園' },
        source: 'maps',
      };

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('代々木公園');
        expect(result.source).toBe('maps');
      }
    });

    it('cached フラグを任意で設定できる', () => {
      const result: ExternalResult<{ id: string }> = {
        ok: true,
        data: { id: '1' },
        cached: true,
        source: 'maps',
      };

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.cached).toBe(true);
      }
    });

    it('data に配列型を持つこともできる', () => {
      const result: ExternalResult<Array<{ id: string }>> = {
        ok: true,
        data: [{ id: '1' }, { id: '2' }],
        source: 'connpass',
      };

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(2);
      }
    });
  });

  describe('失敗時 (ok: false)', () => {
    it('error が rate_limit の失敗を表せる', () => {
      const result: ExternalResult<{ id: string }> = {
        ok: false,
        error: 'rate_limit',
        source: 'maps',
      };

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('rate_limit');
        expect(result.source).toBe('maps');
      }
    });

    it('error が timeout の失敗を表せる', () => {
      const result: ExternalResult<{ id: string }> = {
        ok: false,
        error: 'timeout',
        source: 'connpass',
      };

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('timeout');
      }
    });

    it('error が unknown の失敗を表せる', () => {
      const result: ExternalResult<{ id: string }> = {
        ok: false,
        error: 'unknown',
        source: 'weather',
      };

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe('unknown');
      }
    });
  });

  describe('型ガードによる絞り込み', () => {
    it('if (result.ok) で成功時の型に絞り込める', () => {
      const result: ExternalResult<{ id: string; name: string }> = {
        ok: true,
        data: { id: '1', name: 'テスト' },
        source: 'maps',
      };

      if (result.ok) {
        // この分岐内では result.data は { id: string; name: string } 型
        expect(result.data.name).toBe('テスト');
      } else {
        throw new Error('成功時の分岐に入るはず');
      }
    });

    it('if (!result.ok) で失敗時の型に絞り込める', () => {
      const result: ExternalResult<{ id: string }> = {
        ok: false,
        error: 'rate_limit',
        source: 'maps',
      };

      if (!result.ok) {
        // この分岐内では result.error と result.source が利用可能
        expect(result.error).toBe('rate_limit');
        expect(result.source).toBe('maps');
      } else {
        throw new Error('失敗時の分岐に入るはず');
      }
    });
  });
});
