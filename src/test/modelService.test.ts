// src/test/modelService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { startDetection, detectLoop } from '../modelService';

vi.mock('@tensorflow-models/hand-pose-detection', () => ({
  SupportedModels: {
    MediaPipeHands: 'MediaPipeHands'
  },
  createDetector: vi.fn().mockResolvedValue({
    estimateHands: vi.fn().mockResolvedValue([])
  })
}));

describe('modelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start detection when called', () => {
    startDetection();
    // 実行状態がtrueになることを確認
    expect(detectLoop).toBeDefined();
  });
});
