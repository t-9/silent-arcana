// src/test/logic.test.ts
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockedFunction,
} from 'vitest';
import {
  detectHandsOnce,
  handsToMessage,
  convertHandKeypointsToArray,
  toRelativeLandmarks,
} from '../logic';
import { getDetector } from '../detection/modelService';
import { HandDetector, Hand } from '@tensorflow-models/hand-pose-detection';
import {
  getGestures,
  getCurrentGesture,
  isGameRunning,
  updateScore,
} from '../gameState';
import { detectGesture } from '../gestureService';

vi.mock('../detection/modelService', () => ({
  getDetector: vi.fn(),
}));

vi.mock('../gameState', () => ({
  getGestures: vi.fn(),
  getCurrentGesture: vi.fn(),
  isGameRunning: vi.fn(),
  updateScore: vi.fn(),
}));

vi.mock('../gestureService', () => ({
  detectGesture: vi.fn(),
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
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('handsToMessage', () => {
    it('should return "手が検出されていません" when no hands detected', () => {
      const message = handsToMessage([]);
      expect(message).toBe('手が検出されていません');
    });

    it('should return "手が検出されていません" when hands is undefined', () => {
      const message = handsToMessage(null as unknown as Hand[]);
      expect(message).toBe('手が検出されていません');
    });

    it('should return "手が検出されました" when hands are detected', () => {
      const mockHand: Hand = {
        keypoints: [],
        score: 1.0,
        handedness: 'Left',
      };
      const message = handsToMessage([mockHand]);
      expect(message).toBe('手が検出されました');
    });
  });

  describe('detectHandsOnce', () => {
    const mockVideoEl = {} as HTMLVideoElement;

    it('should return "手が検出されていません" when no hands detected', async () => {
      mockEstimateHands.mockResolvedValue([]);
      const result = await detectHandsOnce(mockDetector, mockVideoEl);
      expect(result).toBe('手が検出されていません');
    });

    it('should handle gesture detection and score update', async () => {
      const mockHand: Hand = {
        keypoints: [
          { x: 0, y: 0, name: 'wrist' },
          { x: 1, y: 1, name: 'thumb_cmc' },
        ],
        score: 1.0,
        handedness: 'Left',
      };
      mockEstimateHands.mockResolvedValue([mockHand]);
      (getGestures as MockedFunction<typeof getGestures>).mockReturnValue([
        { name: 'test', landmarks: [] },
      ]);
      (
        getCurrentGesture as MockedFunction<typeof getCurrentGesture>
      ).mockReturnValue('test');
      (isGameRunning as MockedFunction<typeof isGameRunning>).mockReturnValue(
        true,
      );
      (detectGesture as MockedFunction<typeof detectGesture>).mockReturnValue(
        'test',
      );

      const result = await detectHandsOnce(mockDetector, mockVideoEl);

      expect(result).toBe('手が検出されました');
      expect(console.log).toHaveBeenCalledWith(
        'Raw keypoints:',
        expect.any(Array),
      );
      expect(console.log).toHaveBeenCalledWith(
        'Relative landmarks:',
        expect.any(Array),
      );
      expect(console.log).toHaveBeenCalledWith(
        'Available gestures:',
        expect.any(Array),
      );
      expect(console.log).toHaveBeenCalledWith('Current gesture:', 'test');
      expect(console.log).toHaveBeenCalledWith('Detected gesture:', 'test');
      expect(console.log).toHaveBeenCalledWith('Score updated!');
      expect(updateScore).toHaveBeenCalled();
    });

    it('should not update score when game is not running', async () => {
      const mockHand: Hand = {
        keypoints: [
          { x: 0, y: 0, name: 'wrist' },
          { x: 1, y: 1, name: 'thumb_cmc' },
        ],
        score: 1.0,
        handedness: 'Left',
      };
      mockEstimateHands.mockResolvedValue([mockHand]);
      (getGestures as MockedFunction<typeof getGestures>).mockReturnValue([
        { name: 'test', landmarks: [] },
      ]);
      (
        getCurrentGesture as MockedFunction<typeof getCurrentGesture>
      ).mockReturnValue('test');
      (isGameRunning as MockedFunction<typeof isGameRunning>).mockReturnValue(
        false,
      );
      (detectGesture as MockedFunction<typeof detectGesture>).mockReturnValue(
        'test',
      );

      await detectHandsOnce(mockDetector, mockVideoEl);
      expect(updateScore).not.toHaveBeenCalled();
    });
  });

  describe('convertHandKeypointsToArray', () => {
    it('should convert keypoints to array format', () => {
      const keypoints = [
        { x: 1, y: 2, name: 'wrist' },
        { x: 3, y: 4, name: 'thumb_cmc' },
      ];
      const result = convertHandKeypointsToArray(keypoints);
      // 各出力は [x, y, z] の形式になる（zがない場合は 0 が補完される）
      expect(result[0]).toEqual([1, 2, 0]); // wrist
      expect(result[1]).toEqual([3, 4, 0]); // thumb_cmc
      expect(result[2]).toEqual([0, 0, 0]); // thumb_mcp (not found)
    });
  });

  describe('toRelativeLandmarks', () => {
    it('should convert keypoints to relative coordinates', () => {
      const keypoints = [
        { x: 100, y: 100, name: 'wrist' },
        { x: 200, y: 200, name: 'thumb_cmc' },
      ];
      const result = toRelativeLandmarks(keypoints);
      // convertHandKeypointsToArray で [100,100,0] と [200,200,0] となり、
      // relativePointsはそれぞれ [0,0,0] と [100,100,0] となるので、
      // 正規化後は [0,0,0] と [1,1,0] となる
      expect(result[0]).toEqual([0, 0, 0]); // wrist becomes origin
      expect(result[1]).toEqual([1, 1, 0]); // thumb_cmc relative to wrist and normalized
    });
  });
});
