// src/test/normalizeGestures.test.ts

import { describe, it, expect } from 'vitest';
import { normalizeKeypoints } from '../normalizeGestures';

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
