// src/gestureService.ts
import { toRelativeLandmarks } from './logic';

export interface Gesture {
  name: string;
  landmarks: [number, number][]; // 21点ぶんの (x, y) 座標
}

/**
 * JSONの "gestures" 配列だけ抜き出して返す関数
 */
export async function loadGestureData(url: string): Promise<Gesture[]> {
  const res = await fetch(url);
  const data = await res.json();
  return data.gestures;
}

/**
 * 指定された手の keypoints(21個) を [ [x,y], [x,y], ... ] 形式に変換し、
 * 「(0, 0) 基準にシフト」する簡単な正規化サンプル
 */
function normalizeKeypoints(
  keypoints: { x: number; y: number }[],
): [number, number][] {
  const keypointsWithName = keypoints.map((pt, i) => ({
    x: pt.x,
    y: pt.y,
    name: i === 0 ? 'wrist' : undefined,
    // 本来はきちんと name をつけるのが望ましいが、
    // wrist さえ見つかればスケーリングはできるので暫定的に
  }));
  const rel = toRelativeLandmarks(keypointsWithName);
  return rel as [number, number][];
}

/**
 * 2つの 21点配列(正規化済み) のユークリッド距離を合計して返す
 */
function calcDistance(
  ptsA: [number, number][],
  ptsB: [number, number][],
): number {
  let sum = 0;
  for (let i = 0; i < ptsA.length; i++) {
    const dx = ptsA[i][0] - ptsB[i][0];
    const dy = ptsA[i][1] - ptsB[i][1];
    sum += Math.sqrt(dx * dx + dy * dy);
  }
  return sum;
}

/**
 * 推定された手(21 keypoints) と、あらかじめ用意したジェスチャー一覧(複数)を比較し、
 * 最も近いジェスチャーの name を返す。
 *
 * - distanceThreshold より小さい場合のみ「該当ジェスチャー」とみなす。
 * - それを超える場合は null を返す。
 */
export function detectGesture(
  keypoints: { x: number; y: number }[],
  gestureList: Gesture[],
  distanceThreshold = 1000,
): string | null {
  if (!keypoints || keypoints.length < 21) {
    return null;
  }

  // 推定結果を正規化
  const normalized = normalizeKeypoints(keypoints);

  let bestGesture: string | null = null;
  let minDistance = Number.MAX_VALUE;

  for (const gesture of gestureList) {
    // gesture.landmarksも同じ正規化手順を踏むなら必要
    const gestureNorm = normalizeKeypoints(
      gesture.landmarks.map(([x, y]) => ({ x, y })),
    );

    const dist = calcDistance(normalized, gestureNorm);
    if (dist < minDistance) {
      minDistance = dist;
      bestGesture = gesture.name;
    }
  }

  // 最小距離がしきい値より小さければジェスチャー名、それ以外は null
  return minDistance < distanceThreshold ? bestGesture : null;
}
