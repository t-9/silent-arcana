// src/gestureService.ts
export interface Gesture {
  name: string;
  landmarks: number[][];
}

let gestures: Gesture[] = [];

export async function loadGestureData(): Promise<Gesture[]> {
  try {
    const response = await fetch('/templates/normalizedGestures.json');
    const data = await response.json();
    gestures = data.gestures;
    return gestures;
  } catch (error) {
    console.error('ジェスチャーデータの読み込みに失敗しました:', error);
    throw error;
  }
}

export function getGestures(): Gesture[] {
  return gestures;
}

/**
 * 2つの landmarks 配列のユークリッド距離を合計して返す
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
  distanceThreshold = 20000.0
): string | null {
  if (!keypoints || keypoints.length === 0 || !gestures || gestures.length === 0) {
    console.log('Invalid input:', { keypoints, gestures });
    return null;
  }

  let bestGesture: string | null = null;
  let minDistance = Number.MAX_VALUE;

  for (const gesture of gestures) {
    const dist = calcDistance(keypoints, gesture.landmarks);
    console.log(`Distance for gesture ${gesture.name}:`, dist);
    if (dist < minDistance) {
      minDistance = dist;
      bestGesture = gesture.name;
    }
  }

  console.log('Best gesture:', bestGesture, 'with distance:', minDistance);
  return minDistance < distanceThreshold ? bestGesture : null;
}
