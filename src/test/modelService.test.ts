// src/test/modelService.test.ts
import { startDetection } from '../modelService';

describe('modelService', () => {
  it('startDetection sets running = true (implicit)', () => {
    startDetection();
    // runningを直接確認できないが、
    // detectLoopで"if(!running) return"のところをどう検証するか…など
    // あるいはstopDetection()と合わせてテスト。
  });
});
