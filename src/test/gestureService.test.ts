// src/test/gestureService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectGesture, loadGestureData, getGestures } from '../gestureService';

// グローバルなfetchのモック
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

    it('should calculate distance correctly when z values are undefined', () => {
      // ptsA は z 成分を持たない（undefined とみなされる）配列
      const keypointsA: number[][] = [
        [0, 0], // 3番目の要素がない → (0,0,0) として扱われる
        [3, 4], // → (3,4,0)
      ];
      // ptsB はすべてゼロの座標（明示的に3要素で定義）
      const keypointsB: number[][] = [
        [0, 0, 0],
        [0, 0, 0],
      ];
      // この場合、calcDistance は 0 + sqrt((3-0)²+(4-0)²+(0-0)²) = 5 を返すはず
      // ここでは detectGesture を利用して間接的に calcDistance の動作を確認します
      // たとえば、threshold を 10 に設定すれば、計算結果 5 < 10 となるので該当ジェスチャーが選ばれるはずです
      const gestures = [{ name: 'testGesture', landmarks: keypointsB }];
      const result = detectGesture(keypointsA, gestures, 10, 0.5);
      expect(result).toBe('testGesture');
    });

    it('should calculate distance correctly when z values are undefined(ptsB)', () => {
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
  });
});
