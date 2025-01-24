import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupKeyboardEvents } from '../eventHandlers';
import { getDetector } from '../modelService';
import { detectHandsOnce, toRelativeLandmarks } from '../logic';

vi.mock('../modelService', () => ({
  getDetector: vi.fn()
}));

vi.mock('../logic', () => ({
  detectHandsOnce: vi.fn(),
  toRelativeLandmarks: vi.fn()
}));

describe('eventHandlers', () => {
  describe('setupKeyboardEvents', () => {
    const mockVideoEl = {} as HTMLVideoElement;
    const mockDetector = {
      estimateHands: vi.fn()
    };
    const mockLandmarks = [{ x: 0, y: 0, z: 0 }];

    beforeEach(() => {
      vi.resetAllMocks();
      vi.useFakeTimers();
      (getDetector as any).mockReturnValue(mockDetector);
      (detectHandsOnce as any).mockResolvedValue('手が検出されました');
      (toRelativeLandmarks as any).mockReturnValue([[0, 0, 0]]);
      mockDetector.estimateHands.mockResolvedValue([{ keypoints: mockLandmarks }]);
    });

    it('should setup keyboard event listener', () => {
      setupKeyboardEvents(mockVideoEl);
      expect(getDetector).toHaveBeenCalled();
    });

    it('should not capture when detector is not available', async () => {
      (getDetector as any).mockReturnValue(null);
      setupKeyboardEvents(mockVideoEl);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      await vi.runAllTimersAsync();
      expect(detectHandsOnce).not.toBeCalled();
    });

    it('should not capture when no hand is detected', async () => {
      setupKeyboardEvents(mockVideoEl);
      (detectHandsOnce as any).mockResolvedValue('手が検出されていません');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      await vi.runAllTimersAsync();
      expect(toRelativeLandmarks).not.toBeCalled();
    });

    it('should not capture when estimateHands returns empty array', async () => {
      setupKeyboardEvents(mockVideoEl);
      mockDetector.estimateHands.mockResolvedValue([]);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      await vi.runAllTimersAsync();
      expect(toRelativeLandmarks).not.toBeCalled();
    });

    it('should capture and log landmarks when hand is detected', async () => {
      setupKeyboardEvents(mockVideoEl);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      await vi.runAllTimersAsync();
      expect(detectHandsOnce).toHaveBeenCalledWith(mockDetector, mockVideoEl);
      expect(toRelativeLandmarks).toHaveBeenCalledWith(mockLandmarks);
    });

    it('should not trigger capture for non-C keys', async () => {
      setupKeyboardEvents(mockVideoEl);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      await vi.runAllTimersAsync();
      expect(detectHandsOnce).not.toBeCalled();
    });
  });
}); 