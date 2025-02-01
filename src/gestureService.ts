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
 * 2つのランドマーク配列間のユークリッド距離を計算する
 * @param {number[][]} ptsA - 比較する最初のランドマーク配列
 * @param {number[][]} ptsB - 比較する2番目のランドマーク配列
 * @returns {number} 2つの配列間の総ユークリッド距離
 */
function calcDistance(ptsA: number[][], ptsB: number[][]): number {
  let sum = 0;
  for (let i = 0; i < ptsA.length; i++) {
    const dx = ptsA[i][0] - ptsB[i][0];
    const dy = ptsA[i][1] - ptsB[i][1];
    // ptsA[i][2] と ptsB[i][2] を考慮（もしどちらかが未定義の場合は 0 を補完）
    const dz = (ptsA[i][2] ?? 0) - (ptsB[i][2] ?? 0);
    sum += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return sum;
}

/**
 * 入力されたキーポイントに最も近いジェスチャーを検出する
 * @param {number[][]} keypoints - 検出された手のキーポイント配列
 * @param {Gesture[]} gestures - 比較対象のジェスチャーデータ配列
 * @param {number} distanceThreshold - ジェスチャーとして認識する最大距離の閾値
 * @returns {string | null} 検出されたジェスチャーの名前、または検出失敗時はnull
 */
export function detectGesture(
  keypoints: number[][],
  gestures: Gesture[],
  distanceThreshold = 20000.0,
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
  let minDistance = Number.MAX_VALUE;

  console.log('Input keypoints:', keypoints);
  console.log(
    'Available gestures:',
    gestures.map((g) => ({ name: g.name, landmarks: g.landmarks })),
  );

  for (const gesture of gestures) {
    const dist = calcDistance(keypoints, gesture.landmarks);
    console.log(`Distance for gesture ${gesture.name}:`, dist);
    if (dist < minDistance) {
      minDistance = dist;
      bestGesture = gesture.name;
    }
  }

  console.log('Best gesture:', bestGesture, 'with distance:', minDistance);
  console.log('Threshold:', distanceThreshold);
  return minDistance < distanceThreshold ? bestGesture : null;
}
