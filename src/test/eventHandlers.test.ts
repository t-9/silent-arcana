import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from 'vitest';
import { setupKeyboardEvents } from '../eventHandlers';
import { getDetector } from '../modelService';
import { detectHandsOnce, toRelativeLandmarks } from '../logic';
import { HandDetector } from '@tensorflow-models/hand-pose-detection';

vi.mock('../modelService', () => ({
  getDetector: vi.fn(),
}));

vi.mock('../logic', () => ({
  detectHandsOnce: vi.fn(),
  toRelativeLandmarks: vi.fn(),
}));

describe('eventHandlers', () => {
  describe('setupKeyboardEvents', () => {
    const mockVideoEl = {} as HTMLVideoElement;
    const mockEstimateHands = vi.fn();
    const mockDetector = {
      estimateHands: mockEstimateHands,
      dispose: vi.fn(),
      reset: vi.fn(),
    } as unknown as HandDetector;
    const mockLandmarks = [{ x: 0, y: 0, z: 0 }];

    beforeEach(() => {
      vi.resetAllMocks();
      vi.useFakeTimers();
      (getDetector as MockedFunction<typeof getDetector>).mockReturnValue(
        mockDetector,
      );
      (
        detectHandsOnce as MockedFunction<typeof detectHandsOnce>
      ).mockResolvedValue('手が検出されました');
      (
        toRelativeLandmarks as MockedFunction<typeof toRelativeLandmarks>
      ).mockReturnValue([[0, 0, 0]]);
      mockEstimateHands.mockResolvedValue([{ keypoints: mockLandmarks }]);
    });

    it('should not capture when detector is not available', async () => {
      (getDetector as MockedFunction<typeof getDetector>).mockReturnValue(null);
      setupKeyboardEvents(mockVideoEl);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      await vi.runAllTimersAsync();
      expect(detectHandsOnce).not.toBeCalled();
    });

    it('should not capture when no hand is detected', async () => {
      setupKeyboardEvents(mockVideoEl);
      (
        detectHandsOnce as MockedFunction<typeof detectHandsOnce>
      ).mockResolvedValue('手が検出されていません');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      await vi.runAllTimersAsync();
      expect(toRelativeLandmarks).not.toBeCalled();
    });

    it('should not capture when estimateHands returns empty array', async () => {
      setupKeyboardEvents(mockVideoEl);
      mockEstimateHands.mockResolvedValue([]);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c' }));
      await vi.runAllTimersAsync();
      expect(toRelativeLandmarks).not.toBeCalled();
    });

    it('should not trigger capture for non-C keys', async () => {
      setupKeyboardEvents(mockVideoEl);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
      await vi.runAllTimersAsync();
      expect(detectHandsOnce).not.toBeCalled();
    });
  });
});
