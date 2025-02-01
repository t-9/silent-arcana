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

  // ヘルパー関数: 21個のキーポイント配列を作成する
  function create21Points(
    override: { [index: number]: number[] } = {},
  ): number[][] {
    return Array.from({ length: 21 }, (_, i) => {
      if (i in override) {
        // もし2要素しかない場合は3番目を0で補完する
        return override[i].length < 3 ? [...override[i], 0] : override[i];
      }
      return [0, 0, 0];
    });
  }

  describe('detectGesture', () => {
    // テスト用のパラメータ
    const distanceThreshold = 10;
    const combinedThreshold = 0.5;
    const weightEuclidean = 0.3;
    const weightCosine = 0.4;
    const weightAngle = 0.3;

    it('should return null if keypoints or gestures are empty', () => {
      expect(
        detectGesture(
          [],
          [],
          distanceThreshold,
          combinedThreshold,
          weightEuclidean,
          weightCosine,
          weightAngle,
        ),
      ).toBeNull();
      expect(
        detectGesture(
          create21Points(),
          [],
          distanceThreshold,
          combinedThreshold,
          weightEuclidean,
          weightCosine,
          weightAngle,
        ),
      ).toBeNull();
      expect(
        detectGesture(
          [],
          [{ name: 'a', landmarks: create21Points() }],
          distanceThreshold,
          combinedThreshold,
          weightEuclidean,
          weightCosine,
          weightAngle,
        ),
      ).toBeNull();
    });

    it('should detect matching gesture when keypoints match exactly', () => {
      const keypoints = create21Points({ 1: [1, 1, 1], 2: [2, 2, 2] });
      const gestureLandmarks = create21Points({ 1: [1, 1, 1], 2: [2, 2, 2] });
      const gestures = [{ name: 'test-gesture', landmarks: gestureLandmarks }];
      const result = detectGesture(
        keypoints,
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
      // ptsA: override index 1 に [3,4]（zは省略＝undefined→0に補完）
      const keypointsA = create21Points({ 1: [3, 4] });
      const keypointsB = create21Points(); // すべて [0,0,0]
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
      // ptsB: override index 1 に [3,4]（zはundefined→0に補完）
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
      // すべてのキーポイントが同じ値になるようにして、各サブ配列が全てゼロとなるケース
      const keypoints = create21Points({ 1: [1, 1, 1] });
      // 同じデータのため、各ベクトルは [0,0,0]
      const gesture = {
        name: 'zero',
        landmarks: create21Points({ 1: [1, 1, 1] }),
      };
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

    // 追加：テストケースとして、各グループで「キー点数が一致しない」場合の分岐を確認する
    it('should warn and continue if any finger group has missing keypoints', () => {
      // keypoints の長さを意図的に短くする
      const incompleteKeypoints = create21Points();
      // 例えば index 2 を削除してしまう
      incompleteKeypoints.splice(2, 1); // 長さが20になる
      const gestures = [{ name: 'mismatch', landmarks: create21Points() }];
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});
      const result = detectGesture(
        incompleteKeypoints,
        gestures,
        distanceThreshold,
        combinedThreshold,
        weightEuclidean,
        weightCosine,
        weightAngle,
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'キー点数が一致しません: gesture mismatch',
      );
      expect(result).toBeNull();
      consoleWarnSpy.mockRestore();
    });
  });
});
