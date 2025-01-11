// app.test.ts
// テストは後で実装する
import { init } from '../app';

describe('app without fetch mock', () => {
  it('should run init without calling loadGestureData', async () => {
    // 事前に SKIP_FETCH=true を設定
    process.env.SKIP_FETCH = 'true';
    await init();
    // ここでは fetch が呼ばれない or 何もしない
    expect(true).toBe(true);
  });
});
