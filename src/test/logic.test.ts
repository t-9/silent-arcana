// src/test/logic.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handsToMessage, detectHandsOnce, toRelativeLandmarks } from '../logic';
import { getGestures, getCurrentGesture, isGameRunning, updateScore } from '../gameState';

vi.mock('../gameState');

describe('logic', () => {
  const mockDetector = {
    estimateHands: vi.fn()
  };
  const mockVideoEl = document.createElement('video');
  const mockHands = [{
    keypoints: [
      { name: 'wrist', x: 0, y: 0 },
      { name: 'thumb_tip', x: 1, y: 1 },
      { name: 'index_finger_tip', x: 2, y: 2 }
    ]
  }];

  beforeEach(() => {
    vi.resetAllMocks();
    mockDetector.estimateHands.mockResolvedValue(mockHands);
  });

  describe('handsToMessage', () => {
    it('returns "手が検出されていません" if no hands', () => {
      expect(handsToMessage([])).toBe('手が検出されていません');
    });

    it('returns keypoints info if hands exist', () => {
      const hands = [{ keypoints: [{ x: 0, y: 0 }] }];
      expect(handsToMessage(hands)).toBe('手が検出されました');
    });
  });

  describe('detectHandsOnce', () => {
    it('returns "手が検出されていません" if no hands are detected', async () => {
      mockDetector.estimateHands.mockResolvedValue([]);
      const result = await detectHandsOnce(mockDetector, mockVideoEl);
      expect(result).toBe('手が検出されていません');
    });

    it('should detect gesture and update score when gesture matches', async () => {
      const mockGesture = 'test-gesture';
      const mockKeypoints = [[0, 0], [1, 1], [2, 2]];
      vi.mocked(getGestures).mockReturnValue([{ name: mockGesture, keypoints: mockKeypoints }]);
      vi.mocked(getCurrentGesture).mockReturnValue(mockGesture);
      vi.mocked(isGameRunning).mockReturnValue(true);

      await detectHandsOnce(mockDetector, mockVideoEl);

      expect(updateScore).toBeCalled();
    });

    it('should not update score when gesture does not match', async () => {
      const mockGesture = 'test-gesture';
      const mockKeypoints = [[0, 0], [1, 1], [2, 2]];
      vi.mocked(getGestures).mockReturnValue([{ name: mockGesture, keypoints: mockKeypoints }]);
      vi.mocked(getCurrentGesture).mockReturnValue('different-gesture');
      vi.mocked(isGameRunning).mockReturnValue(true);

      await detectHandsOnce(mockDetector, mockVideoEl);

      expect(updateScore).not.toBeCalled();
    });

    it('should not update score when game is not running', async () => {
      const mockGesture = 'test-gesture';
      const mockKeypoints = [[0, 0], [1, 1], [2, 2]];
      vi.mocked(getGestures).mockReturnValue([{ name: mockGesture, keypoints: mockKeypoints }]);
      vi.mocked(getCurrentGesture).mockReturnValue(mockGesture);
      vi.mocked(isGameRunning).mockReturnValue(false);

      await detectHandsOnce(mockDetector, mockVideoEl);

      expect(updateScore).not.toBeCalled();
    });
  });
});
