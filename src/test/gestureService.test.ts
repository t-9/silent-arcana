// src/test/gestureService.test.ts
import { detectGesture, Gesture } from '../gestureService';

describe('detectGesture', () => {
  const gestures: Gesture[] = [
    {
      name: 'ありがとう',
      landmarks: [
        [0, 0],
        [1, 1],
        [2, 2],
        [0, 0],
        [1, 1],
        [2, 2],
        [0, 0],
        [1, 1],
        [2, 2],
        [0, 0],
        [1, 1],
        [2, 2],
        [0, 0],
        [1, 1],
        [2, 2],
        [0, 0],
        [1, 1],
        [2, 2],
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    },
    {
      name: 'hello',
      landmarks: [
        [3, 3],
        [4, 4],
        [5, 5],
        [3, 3],
        [4, 4],
        [5, 5],
        [3, 3],
        [4, 4],
        [5, 5],
        [3, 3],
        [4, 4],
        [5, 5],
        [3, 3],
        [4, 4],
        [5, 5],
        [3, 3],
        [4, 4],
        [5, 5],
        [3, 3],
        [4, 4],
        [5, 5],
      ],
    },
  ];

  it('returns the correct gesture when a match is found', () => {
    const keypoints = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const result = detectGesture(keypoints, gestures, 10);
    expect(result).toBe('ありがとう');
  });

  it('returns null when no match is found', () => {
    const keypoints = [
      { x: 10000, y: 10000 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
      { x: 30, y: 30 },
    ];
    const result = detectGesture(keypoints, gestures, 10);
    expect(result).toBeNull();
  });
});
