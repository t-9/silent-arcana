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
  });
});
