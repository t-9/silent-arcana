// src/test/gestureService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectGesture, loadGestureData, getGestures } from '../gestureService';

// グローバルな fetch のモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('gestureService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // テスト前にモジュールの状態をリセット
    vi.resetModules();
  });

  describe('getGestures', () => {
    it('should return empty array before loading', () => {
      const result = getGestures();
      expect(result).toEqual([]);
    });

    it('should return loaded gestures', async () => {
      const mockGestures = {
        gestures: [
          {
            name: 'test-gesture',
            landmarks: [
              [0, 0],
              [1, 1],
            ],
          },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockGestures),
      });

      await loadGestureData();
      const result = getGestures();
      expect(result).toEqual(mockGestures.gestures);
    });
  });

  describe('loadGestureData', () => {
    it('should load gesture data successfully', async () => {
      const mockGestures = {
        gestures: [
          {
            name: 'test-gesture',
            landmarks: [
              [0, 0],
              [1, 1],
            ],
          },
        ],
      };
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockGestures),
      });

      const result = await loadGestureData();
      expect(result).toEqual(mockGestures.gestures);
      expect(mockFetch).toHaveBeenCalledWith(
        './templates/normalizedGestures.json',
      );
    });

    it('should handle fetch error', async () => {
      const error = new Error('Fetch failed');
      mockFetch.mockRejectedValueOnce(error);

      await expect(loadGestureData()).rejects.toThrow('Fetch failed');
      expect(mockFetch).toHaveBeenCalledWith(
        './templates/normalizedGestures.json',
      );
    });

    it('should handle json parse error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(loadGestureData()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('detectGesture', () => {
    const keypointsMatch = [
      [0, 0, 0],
      [1, 1, 1],
      [2, 2, 2],
    ];

    const gestures = [
      {
        name: 'test-gesture',
        landmarks: [
          [0, 0, 0],
          [1, 1, 1],
          [2, 2, 2],
        ],
      },
    ];

    it('should detect matching gesture', () => {
      const result = detectGesture(keypointsMatch, gestures);
      expect(result).toBe('test-gesture');
    });

    it('should return null for empty gestures array', () => {
      const result = detectGesture(keypointsMatch, []);
      expect(result).toBeNull();
    });

    it('should return null for empty keypoints array', () => {
      const result = detectGesture([], gestures);
      expect(result).toBeNull();
    });

    it('should return null when distance exceeds threshold', () => {
      const farKeypoints = [
        [100, 100, 100],
        [200, 200, 200],
        [300, 300, 300],
      ];
      const result = detectGesture(farKeypoints, gestures, 1.0); // 小さいしきい値を設定
      expect(result).toBeNull();
    });

    it('should calculate distance correctly when z values are undefined (ptsA)', () => {
      // ptsA は z 成分を持たない（undefined とみなされる）配列
      const keypointsA: number[][] = [
        [0, 0], // → [0, 0, 0] として扱われる
        [3, 4], // → [3, 4, 0]
      ];
      // ptsB はすべて明示的に3要素で定義
      const keypointsB: number[][] = [
        [0, 0, 0],
        [0, 0, 0],
      ];
      const gestures = [{ name: 'testGesture', landmarks: keypointsB }];
      const result = detectGesture(keypointsA, gestures, 10, 0.5);
      expect(result).toBe('testGesture');
    });

    it('should calculate distance correctly when z values are undefined (ptsB)', () => {
      const keypointsA: number[][] = [
        [0, 0, 0],
        [3, 4, 0],
      ];
      const keypointsB: number[][] = [
        [0, 0],
        [0, 0],
      ];
      const gestures = [{ name: 'testGesture', landmarks: keypointsB }];
      const result = detectGesture(keypointsA, gestures, 10, 0.5);
      expect(result).toBe('testGesture');
    });

    // 追加テストケース：キー点数が一致しない場合
    it('should warn and continue if keypoints length mismatch', () => {
      // keypoints (A) の長さは 2 に対し、gesture の landmarks (B) の長さは 3 で不一致
      const keypoints = [
        [0, 0, 0],
        [1, 1, 1],
      ];
      const gestureWithMismatch = {
        name: 'mismatch',
        landmarks: [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
        ],
      };
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const result = detectGesture(keypoints, [gestureWithMismatch], 10, 0.5);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `キー点数が一致しません: gesture mismatch`,
      );
      expect(result).toBeNull();
      consoleWarnSpy.mockRestore();
    });

    // 追加テストケース：両方のノルムが 0 の場合（cosine を 1 とする）
    it('should set cosine to 1 when both norms are zero', () => {
      const keypoints = [[0, 0, 0]];
      const gesture = { name: 'zero', landmarks: [[0, 0, 0]] };
      const result = detectGesture(keypoints, [gesture], 10, 0.5);
      expect(result).toBe('zero');
    });
  });
});
