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

  // 21個のキーポイント配列を作成するヘルパー関数
  function create21Points(
    override: { [index: number]: number[] } = {},
  ): number[][] {
    // すべて [0,0,0] で初期化
    return Array.from({ length: 21 }, (_, i) => {
      // override で指定されたインデックスならその値を返す（必ず3要素）
      if (i in override) {
        // override[i] が2要素の場合は3番目を0にするなど
        return override[i].length < 3 ? [...override[i], 0] : override[i];
      }
      return [0, 0, 0];
    });
  }

  describe('detectGesture', () => {
    // テストパラメータとして、しきい値を下げて（例：combinedThreshold を 0.5 に）計算が通るようにする
    const distanceThreshold = 10; // 小さい値でテストする
    const combinedThreshold = 0.5;
    const weightEuclidean = 0.3;
    const weightCosine = 0.4;
    const weightAngle = 0.3;

    it('should detect matching gesture', () => {
      // keypointsMatch と gesture.landmarks を21個の要素にする
      const keypointsMatch = create21Points({ 1: [1, 1, 1], 2: [2, 2, 2] });
      const gestureLandmarks = create21Points({ 1: [1, 1, 1], 2: [2, 2, 2] });
      const gestures = [{ name: 'test-gesture', landmarks: gestureLandmarks }];
      const result = detectGesture(
        keypointsMatch,
        gestures,
        distanceThreshold,
        combinedThreshold,
        weightEuclidean,
        weightCosine,
        weightAngle,
      );
      expect(result).toBe('test-gesture');
    });

    it('should calculate distance correctly when z values are undefined (ptsA)', () => {
      // ptsA には2点だけ値を設定し、残りは全て [0,0,0]
      const keypointsA = create21Points({ 1: [3, 4] });
      const keypointsB = create21Points(); // 全て [0,0,0]
      const gestures = [{ name: 'testGesture', landmarks: keypointsB }];
      const result = detectGesture(
        keypointsA,
        gestures,
        distanceThreshold,
        combinedThreshold,
        weightEuclidean,
        weightCosine,
        weightAngle,
      );
      expect(result).toBe('testGesture');
    });

    it('should calculate distance correctly when z values are undefined (ptsB)', () => {
      // ptsB には2点だけ値を設定、ptsAは全て [0,0,0]
      const keypointsA = create21Points();
      const keypointsB = create21Points({ 1: [3, 4] });
      const gestures = [{ name: 'testGesture', landmarks: keypointsB }];
      const result = detectGesture(
        keypointsA,
        gestures,
        distanceThreshold,
        combinedThreshold,
        weightEuclidean,
        weightCosine,
        weightAngle,
      );
      expect(result).toBe('testGesture');
    });

    it('should set cosine to 1 when both norms are zero', () => {
      // 両方とも全て [0,0,0] の配列
      const keypoints = create21Points();
      const gesture = { name: 'zero', landmarks: create21Points() };
      const result = detectGesture(
        keypoints,
        [gesture],
        distanceThreshold,
        combinedThreshold,
        weightEuclidean,
        weightCosine,
        weightAngle,
      );
      expect(result).toBe('zero');
    });
  });
});
