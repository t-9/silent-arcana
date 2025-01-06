// src/test/gestureService.test.ts
import { detectGesture, Gesture } from '../gestureService';

/**
 * テストデータを共通化する関数
 */
function setupTestData() {
  const gestures: Gesture[] = [
    {
      name: 'ありがとう',
      landmarks: Array(21)
        .fill([0, 0])
        .map(([x, y], i) => [x + (i % 3), y + (i % 3)]),
    },
    {
      name: 'hello',
      landmarks: Array(21)
        .fill([3, 3])
        .map(([x, y], i) => [x + (i % 3), y + (i % 3)]),
    },
  ];

  const keypointsMatch = Array(21)
    .fill({ x: 0, y: 0 })
    .map(({ x, y }, i) => ({ x: x + (i % 3), y: y + (i % 3) }));

  const keypointsNoMatch = Array(21).fill({ x: 10000, y: 10000 });

  return { gestures, keypointsMatch, keypointsNoMatch };
}

describe('detectGesture', () => {
  const { gestures, keypointsMatch, keypointsNoMatch } = setupTestData();

  it('returns the correct gesture when a match is found', () => {
    const result = detectGesture(keypointsMatch, gestures, 10);
    expect(result).toBe('ありがとう');
  });

  it('returns null when no match is found', () => {
    const result = detectGesture(keypointsNoMatch, gestures, 10);
    expect(result).toBeNull();
  });
});
