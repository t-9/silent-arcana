// src/test/gestureService.test.ts
import { describe, it, expect } from 'vitest';
import { detectGesture } from '../gestureService';

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
});
