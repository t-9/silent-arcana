// src/gestureService.ts

// ↓ 環境によっては assert が必要な場合があります
// import gestureData from '../templates/dummyGestures.json' assert { type: 'json' };

export interface Gesture {
  name: string;
  landmarks: [number, number][]; // 21点ぶんの (x, y) 座標
}

/**
 * JSONの "gestures" 配列だけ抜き出して返す関数
 *
 * 環境によっては下記のような "fetch" を使った読み込みが必要です:
 *
 *  export async function loadGestureData(url: string): Promise<Gesture[]> {
 *    const res = await fetch(url);
 *    const data = await res.json();
 *    return data.gestures;
 *  }
 *
 * あるいは "import gestureData from '../templates/dummyGestures.json'"
 * で済む環境なら不要です。
 */
export async function loadGestureData(url: string): Promise<Gesture[]> {
  const res = await fetch(url);
  const data = await res.json();
  // dataは { gestures: [ { name, landmarks: [...] }, ... ] } の想定
  return data.gestures;
}

/**
 * 指定された手の keypoints(21個) を [ [x,y], [x,y], ... ] 形式に変換し、
 * 「(0, 0) 基準にシフト」する簡単な正規化サンプル
 */
function normalizeKeypoints(
  keypoints: { x: number; y: number }[],
): [number, number][] {
  const points = keypoints.map((k) => [k.x ?? 0, k.y ?? 0]);

  // 例：最初の点(手首)を(0,0)とする
  const [baseX, baseY] = points[0];
  const shifted = points.map(([x, y]) => [x - baseX, y - baseY]);

  // 必要に応じてバウンディングボックスや全体の長さでスケール調整も可能
  // ここでは省略

  return shifted as [number, number][];
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
