// src/gestureService.ts

/**
 * ジェスチャー認識に関連する型定義とユーティリティ関数を提供するモジュール
 */

/**
 * ジェスチャーを表すインターフェース
 * @interface Gesture
 * @property {string} name - ジェスチャーの名前
 * @property {number[][]} landmarks - ジェスチャーを構成する座標点の配列
 */
export interface Gesture {
  name: string;
  landmarks: number[][];
}

let gestures: Gesture[] = [];

/**
 * 指定されたURLからジェスチャーデータを読み込む
 * @param {string} url - ジェスチャーデータのJSON URLパス
 * @returns {Promise<Gesture[]>} 読み込まれたジェスチャーデータの配列
 * @throws {Error} データの読み込みに失敗した場合
 */
export async function loadGestureData(
  url: string = './templates/normalizedGestures.json',
): Promise<Gesture[]> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    gestures = data.gestures;
    return gestures;
  } catch (error) {
    console.error('ジェスチャーデータの読み込みに失敗しました:', error);
    throw error;
  }
}

/**
 * 現在読み込まれているジェスチャーデータを取得する
 * @returns {Gesture[]} ジェスチャーデータの配列
 */
export function getGestures(): Gesture[] {
  return gestures;
}

/**
 * 入力されたキーポイントに最も近いジェスチャーを検出する。
 * ユークリッド距離とコサイン類似度を組み合わせた重み付けスコアが閾値以上なら
 * ジェスチャーの名前を返す。
 *
 * @param keypoints - 検出された手のキーポイント配列
 * @param gestures - 比較対象のジェスチャーデータ配列
 * @param distanceThreshold - ユークリッド距離の閾値（例: 20000.0）
 * @param combinedThreshold - 合成スコアの閾値（例: 0.8）
 * @param weightEuclidean - ユークリッド距離の重み（例: 0.5）
 * @param weightCosine - コサイン類似度の重み（例: 0.5）
 * @returns 検出されたジェスチャーの名前、または認識失敗時は null
 */
export function detectGesture(
  keypoints: number[][],
  gestures: Gesture[],
  distanceThreshold = 20000.0,
  combinedThreshold = 0.8,
  weightEuclidean = 0.5,
  weightCosine = 0.5,
): string | null {
  if (
    !keypoints ||
    keypoints.length === 0 ||
    !gestures ||
    gestures.length === 0
  ) {
    console.log('Invalid input:', { keypoints, gestures });
    return null;
  }

  let bestGesture: string | null = null;
  let bestScore = -Infinity;

  // ユークリッド距離をスコア化する関数
  const scoreFromDistance = (dist: number): number => {
    return Math.max(0, (distanceThreshold - dist) / distanceThreshold);
  };

  // ここで、各サブ配列が必ず3要素になるように平坦化する
  const flatA = flattenKeypoints(keypoints);

  for (const gesture of gestures) {
    // ユークリッド距離の計算
    const euclideanDistance = calcDistance(keypoints, gesture.landmarks);
    const scoreEuclidean = scoreFromDistance(euclideanDistance);

    // キーポイントを平坦化してコサイン類似度を計算
    const flatB = flattenKeypoints(gesture.landmarks);
    if (flatA.length !== flatB.length) {
      console.warn(`キー点数が一致しません: gesture ${gesture.name}`);
      continue;
    }
    const dot = flatA.reduce((acc, val, i) => acc + val * flatB[i], 0);
    const normA = Math.sqrt(flatA.reduce((acc, val) => acc + val * val, 0));
    const normB = Math.sqrt(flatB.reduce((acc, val) => acc + val * val, 0));

    // ノルムがゼロの場合の安全処理
    let cosine: number;
    if (normA === 0 && normB === 0) {
      cosine = 1;
    } else if (normA === 0 || normB === 0) {
      cosine = 0;
    } else {
      cosine = dot / (normA * normB);
    }
    // -1～1 の範囲を 0～1 に正規化
    const scoreCosine = (cosine + 1) / 2;

    // 両方のスコアを重み付けして合成
    const combinedScore =
      weightEuclidean * scoreEuclidean + weightCosine * scoreCosine;

    console.log(
      `Gesture "${gesture.name}": Euclidean Score = ${scoreEuclidean.toFixed(3)}, Cosine Score = ${scoreCosine.toFixed(3)}, Combined Score = ${combinedScore.toFixed(3)}`,
    );

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestGesture = gesture.name;
    }
  }

  return bestScore >= combinedThreshold ? bestGesture : null;
}

/**
 * 2次元配列の各サブ配列を必ず長さ3に補完しながら平坦化するヘルパー関数
 * @param points 各キーポイントの座標配列
 * @returns 平坦化された数値の一次元配列
 */
function flattenKeypoints(points: number[][]): number[] {
  return points
    .map((pt) => {
      // 3つ未満なら足りない分を0で補完する
      if (pt.length < 3) {
        return [...pt, ...Array(3 - pt.length).fill(0)];
      }
      return pt;
    })
    .flat();
}

/**
 * 2つのランドマーク配列間のユークリッド距離を計算する
 * @param ptsA - 1つ目のキーポイント配列
 * @param ptsB - 2つ目のキーポイント配列
 * @returns 距離
 */
function calcDistance(ptsA: number[][], ptsB: number[][]): number {
  let sum = 0;
  for (let i = 0; i < ptsA.length; i++) {
    const dx = ptsA[i][0] - ptsB[i][0];
    const dy = ptsA[i][1] - ptsB[i][1];
    const dz = (ptsA[i][2] ?? 0) - (ptsB[i][2] ?? 0);
    sum += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return sum;
}
