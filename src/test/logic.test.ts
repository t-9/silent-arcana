// src/test/logic.test.ts
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from 'vitest';
import { detectHandsOnce, handsToMessage } from '../logic';
import { getDetector } from '../modelService';
import { HandDetector } from '@tensorflow-models/hand-pose-detection';

vi.mock('../modelService', () => ({
  getDetector: vi.fn(),
}));

describe('logic', () => {
  const mockEstimateHands = vi.fn();
  const mockDetector = {
    estimateHands: mockEstimateHands,
    dispose: vi.fn(),
    reset: vi.fn(),
  } as unknown as HandDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    (getDetector as MockedFunction<typeof getDetector>).mockReturnValue(
      mockDetector,
    );
  });

  describe('handsToMessage', () => {
    it('should return "手が検出されていません" when no hands detected', () => {
      const message = handsToMessage([]);
      expect(message).toBe('手が検出されていません');
    });
  });

  describe('detectHandsOnce', () => {
    const mockVideoEl = {} as HTMLVideoElement;

    it('should return "手が検出されていません" when no hands detected', async () => {
      mockEstimateHands.mockResolvedValue([]);
      const result = await detectHandsOnce(mockDetector, mockVideoEl);
      expect(result).toBe('手が検出されていません');
    });
  });
});
