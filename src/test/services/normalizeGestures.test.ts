// src/test/normalizeGestures.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import {
  normalizeKeypoints,
  normalizeGestures,
} from '../../services/normalizeGestures';
import {
  defaultMockData,
  mockDataWithUnknownKeypoints,
  mockDataWithEmptyGestures,
  mockDataWithoutWrist,
} from '../fixtures/gestureData';

vi.mock('fs');
const mockedFs = vi.mocked(fs);

// テスト用のパス
const TEST_DUMMY_GESTURES_PATH = './test/dummy/dummyGestures.json';
const TEST_NORMALIZED_GESTURES_PATH = './test/dummy/normalizedGestures.json';

console.log('Dummy Gestures Path:', TEST_DUMMY_GESTURES_PATH);
console.log('Normalized Gestures Path:', TEST_NORMALIZED_GESTURES_PATH);

// logic.tsのモック
vi.mock('../logic', () => ({
  toRelativeLandmarks: (keypoints: { x: number; y: number; z: number }[]) =>
    keypoints.map(({ x, y }) => [x, y]),
}));

describe('normalizeKeypoints', () => {
  it('should normalize gesture keypoints', () => {
    const input = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 },
      { x: 2, y: 2, z: 2 },
    ];
    const expected = [
      [0, 0, 0],
      [1, 1, 1],
      [2, 2, 2],
    ];
    expect(normalizeKeypoints(input)).toEqual(expected);
  });

  it('should handle empty input', () => {
    expect(normalizeKeypoints([])).toEqual([]);
  });
});

describe('normalizeGestures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockedFs.writeFileSync.mockImplementation(() => undefined);
    mockedFs.readFileSync.mockImplementation(
      (path: fs.PathOrFileDescriptor) => {
        if (typeof path === 'string') {
          // dummyGestures.json
          if (path.includes('dummyGestures.json')) {
            return JSON.stringify(defaultMockData);
          }
          // custom.json
          else if (path.includes('custom.json')) {
            return JSON.stringify({
              gestures: [{ name: 'custom-gesture', landmarks: [[0, 0]] }],
            });
          }
          // 必要に応じて条件を追加

          // デフォルト: 空ジェスチャーの JSON を返す
          return JSON.stringify({ gestures: [] });
        }
        // パスが string でない場合 (基本ありえない想定)
        return '';
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should normalize and save gesture data', () => {
    normalizeGestures(TEST_DUMMY_GESTURES_PATH, TEST_NORMALIZED_GESTURES_PATH);
    expect(console.log).toHaveBeenCalledWith(
      'Gesture "あ": wrist found = true',
    );
    expect(console.warn).not.toHaveBeenCalled();
    expect(mockedFs.writeFileSync).toHaveBeenCalled();
  });

  it('should handle gesture without wrist keypoint', () => {
    mockedFs.readFileSync.mockReturnValueOnce(
      JSON.stringify(mockDataWithoutWrist),
    );
    normalizeGestures(TEST_DUMMY_GESTURES_PATH, TEST_NORMALIZED_GESTURES_PATH);
    expect(console.log).toHaveBeenCalledWith(
      'Gesture "test-gesture": wrist found = false',
    );
    expect(console.warn).toHaveBeenCalledWith(
      'Gesture "test-gesture" does not have a wrist keypoint.',
    );
  });

  it('should handle custom file paths', () => {
    const customInputPath = './test/dummy/dummyGestures.json';
    const customOutputPath = './test/dummy/normalizedGestures.json';
    normalizeGestures(customInputPath, customOutputPath);
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(
      customInputPath,
      'utf-8',
    );
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      customOutputPath,
      expect.any(String),
    );
  });

  it('should handle unknown keypoint indices', () => {
    mockedFs.readFileSync.mockReturnValueOnce(
      JSON.stringify(mockDataWithUnknownKeypoints),
    );
    normalizeGestures(TEST_DUMMY_GESTURES_PATH, TEST_NORMALIZED_GESTURES_PATH);
    expect(console.log).toHaveBeenCalledWith(
      'Gesture "test-gesture": wrist found = true',
    );
    expect(mockedFs.writeFileSync).toHaveBeenCalled();
  });

  it('should handle empty gestures array', () => {
    mockedFs.readFileSync.mockReturnValueOnce(
      JSON.stringify(mockDataWithEmptyGestures),
    );
    normalizeGestures(TEST_DUMMY_GESTURES_PATH, TEST_NORMALIZED_GESTURES_PATH);
    expect(mockedFs.writeFileSync).toHaveBeenCalled();
  });
});
