// src/test/normalizeGestures.test.ts

import { describe, it, expect, vi } from 'vitest';
import { normalizeKeypoints, normalizeGestures } from '../normalizeGestures';
import * as logic from '../logic';

vi.mock('fs', () => {
  const mockGestures = {
    gestures: [
      { name: 'テスト手話1', landmarks: [[0, 0], [1, 1], [2, 2]] },
      { name: 'テスト手話2', landmarks: [[3, 3], [4, 4], [5, 5]] }
    ]
  };

  return {
    readFileSync: vi.fn().mockReturnValue(JSON.stringify(mockGestures)),
    writeFileSync: vi.fn(),
    default: {
      readFileSync: vi.fn().mockReturnValue(JSON.stringify(mockGestures)),
      writeFileSync: vi.fn()
    }
  };
});

vi.mock('../logic', () => ({
  toRelativeLandmarks: vi.fn().mockImplementation((keypoints) => {
    return keypoints.map(kp => [kp.x, kp.y]);
  })
}));

describe('normalizeKeypoints', () => {
  it('should normalize gesture keypoints', () => {
    const input = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1 },
      { x: 2, y: 2, z: 2 }
    ];
    const expected = [[0, 0, 0], [1, 1, 1], [2, 2, 2]];
    expect(normalizeKeypoints(input)).toEqual(expected);
  });

  it('should handle empty input', () => {
    expect(normalizeKeypoints([])).toEqual([]);
  });
});

describe('normalizeGestures', () => {
  it('should normalize and save gesture data', () => {
    const consoleLogSpy = vi.spyOn(console, 'log');
    normalizeGestures();
    expect(consoleLogSpy).toHaveBeenCalledWith('ジェスチャーデータを正規化して保存しました。');
  });

  it('should handle gesture without wrist keypoint', () => {
    vi.mock('fs', () => {
      const mockGestures = {
        gestures: [
          {
            name: 'テスト手話1',
            landmarks: []
          }
        ]
      };
      return {
        readFileSync: vi.fn().mockReturnValue(JSON.stringify(mockGestures)),
        writeFileSync: vi.fn(),
        default: {
          readFileSync: vi.fn().mockReturnValue(JSON.stringify(mockGestures)),
          writeFileSync: vi.fn()
        }
      };
    }, { virtual: true });

    const consoleLogSpy = vi.spyOn(console, 'log');
    const consoleWarnSpy = vi.spyOn(console, 'warn');
    normalizeGestures();
    expect(consoleLogSpy).toHaveBeenCalledWith('Gesture "テスト手話1": wrist found = false');
    expect(consoleWarnSpy).toHaveBeenCalledWith('Gesture "テスト手話1" does not have a wrist keypoint.');
  });
});
