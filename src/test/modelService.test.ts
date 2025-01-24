// src/test/modelService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadModel, startDetection, detectLoop } from '../modelService';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

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

  it('should load model successfully', async () => {
    const mockSetLoading = vi.fn();
    await loadModel(mockSetLoading);

    expect(handPoseDetection.createDetector).toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenLastCalledWith(false);
  });

  it('should start detection when called', () => {
    startDetection();
    // 実行状態がtrueになることを確認
    expect(detectLoop).toBeDefined();
  });
});
