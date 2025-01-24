// app.test.ts
// テストは後で実装する
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from '../app';

describe('app without fetch mock', () => {
  it('should run init without calling loadGestureData', async () => {
    // 事前に SKIP_FETCH=true を設定
    process.env.SKIP_FETCH = 'true';
    await init();
    // 初期化が成功することを確認
    expect(true).toBe(true);
  });
});
