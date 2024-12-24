// src/test/modelService.test.ts
import { loadModel, startDetection, detectLoop } from '../modelService';
import { jest } from '@jest/globals';
import { HandDetector, Hand } from '@tensorflow-models/hand-pose-detection';

// モックの HandDetector
class MockHandDetector implements HandDetector {
  estimateHands(): Promise<Hand[]> {
    return Promise.resolve([
      {
        keypoints: [{ name: 'thumb', x: 0.5, y: 0.5 }],
        handedness: 'Left',
        score: 0.9,
      },
    ]);
  }
  dispose(): void { }
  reset(): void { }
}

describe('modelService', () => {
  it('startDetection sets running = true (implicit)', () => {
    startDetection();
    // runningを直接確認できないが、
    // detectLoopで"if(!running) return"のところをどう検証するか…など
    // あるいはstopDetection()と合わせてテスト。
  });
});
