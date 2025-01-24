// src/gestureService.ts
import { toRelativeLandmarks } from './logic';

export interface Gesture {
  name: string;
  keypoints: number[][];
}

/**
 * 2つの keypoints 配列のユークリッド距離を合計して返す
 */
function calcDistance(ptsA: number[][], ptsB: number[][]): number {
  let sum = 0;
  for (let i = 0; i < ptsA.length; i++) {
    const dx = ptsA[i][0] - ptsB[i][0];
    const dy = ptsA[i][1] - ptsB[i][1];
    sum += Math.sqrt(dx * dx + dy * dy);
  }
  return sum;
}

/**
 * 推定された手と、あらかじめ用意したジェスチャー一覧を比較し、
 * 最も近いジェスチャーの name を返す。
 */
export function detectGesture(
  keypoints: number[][],
  gestures: Gesture[],
  distanceThreshold = 5.0
): string | null {
  if (!keypoints || keypoints.length === 0 || !gestures || gestures.length === 0) {
    return null;
  }

  let bestGesture: string | null = null;
  let minDistance = Number.MAX_VALUE;

  for (const gesture of gestures) {
    const dist = calcDistance(keypoints, gesture.keypoints);
    if (dist < minDistance) {
      minDistance = dist;
      bestGesture = gesture.name;
    }
  }

  return minDistance < distanceThreshold ? bestGesture : null;
}
