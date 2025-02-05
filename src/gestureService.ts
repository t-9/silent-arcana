// src/gestureService.ts

/**
 * ジェスチャーを表すインターフェース
 * @interface Gesture
 * @property {string} name - ジェスチャーの名前
 * @property {number[][]} landmarks - ジェスチャーを構成する座標点の配列（各点は [x, y, z]）
 */
export interface Gesture {
  name: string;
  landmarks: number[][];
}

let gestures: Gesture[] = [];

/**
 * 指定されたURLからジェスチャーデータを読み込む
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
 */
export function getGestures(): Gesture[] {
  return gestures;
}

/**
 * 入力されたキーポイントに最も近いジェスチャーを検出する。
 * 各指（親指、人差し指、中指、薬指、小指）ごとにユークリッド距離、コサイン類似度、角度差からスコアを計算し、
 * 各指グループのスコアの「最小値」を全体の評価スコアとする。
 *
 * @param keypoints - 検出された手のキーポイント配列（手首を原点として正規化済み）
 * @param gestures - 比較対象のジェスチャーデータ配列
 * @param distanceThreshold - ユークリッド距離の閾値（例: 20000.0）
 * @param combinedThreshold - 合成スコアの閾値（例: 0.8）
 * @param weightEuclidean - ユークリッド距離スコアの重み（例: 0.3）
 * @param weightCosine - コサイン類似度スコアの重み（例: 0.4）
 * @param weightAngle - 角度スコアの重み（例: 0.3）
 * @returns 検出結果を含むオブジェクト
 */
export interface GestureDetectionResult {
  gesture: string | null;
  score: number;
  threshold: number;
  message: string;
}

export function detectGesture(
  keypoints: number[][],
  gestures: Gesture[],
  distanceThreshold = 300000.0,
  combinedThreshold = 0.2,
  weightEuclidean = 0.3,
  weightCosine = 0.4,
  weightAngle = 0.3,
): GestureDetectionResult {
  if (
    !keypoints ||
    keypoints.length === 0 ||
    !gestures ||
    gestures.length === 0
  ) {
    console.log('Invalid input:', { keypoints, gestures });
    return {
      gesture: null,
      score: 0,
      threshold: combinedThreshold,
      message: '入力が無効です'
    };
  }

  // 各指グループ（手首（index 0）は除く）
  const fingerGroups = [
    [1, 2, 3, 4], // 親指
    [5, 6, 7, 8], // 人差し指
    [9, 10, 11, 12], // 中指
    [13, 14, 15, 16], // 薬指
    [17, 18, 19, 20], // 小指
  ];

  // 指定されたインデックス群から元の配列の値を取り出す
  const getFingerPoints = (points: number[][], indices: number[]) =>
    indices.map((i) => points[i]);

  // ユークリッド距離スコアを計算する
  const scoreFromDistance = (dist: number): number =>
    Math.max(0, (distanceThreshold - dist) / distanceThreshold);

  // キーポイント配列を平坦化する（ここでは補完処理は不要と考え、既に各要素は3要素である前提）
  const flattenKeypoints = (points: number[][]): number[] =>
    points.filter((pt) => pt && pt.length >= 3).flat();

  // 2つの点群間のユークリッド距離を計算する
  const calcDistance = (ptsA: number[][], ptsB: number[][]): number => {
    let sum = 0;
    for (let i = 0; i < ptsA.length; i++) {
      const dx = ptsA[i][0] - ptsB[i][0];
      const dy = ptsA[i][1] - ptsB[i][1];
      const dz = (ptsA[i][2] ?? 0) - (ptsB[i][2] ?? 0);
      sum += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    return sum;
  };

  // 1つのジェスチャーに対する各指グループの統合スコア（最小値）を計算する
  function computeGestureScore(gesture: Gesture): number | null {
    const scores: number[] = [];
    for (const group of fingerGroups) {
      const subA = getFingerPoints(keypoints, group);
      const subB = getFingerPoints(gesture.landmarks, group);
      const groupScore = computeFingerGroupScore(subA, subB, gesture.name);
      if (groupScore === null) {
        return null;
      }
      scores.push(groupScore);
    }
    return Math.min(...scores);
  }

  function computeFingerGroupScore(
    subA: number[][],
    subB: number[][],
    gestureName: string,
  ): number | null {
    // キーポイントの数や長さが正しくなければ無効とする
    if (
      subA.some((pt) => !pt || pt.length !== 3) ||
      subB.some((pt) => !pt || pt.length !== 3)
    ) {
      console.warn(`キー点数が一致しません: gesture ${gestureName}`);
      return null;
    }

    const dist = calcDistance(subA, subB);
    const scoreEuclidean = scoreFromDistance(dist);

    const flatA = flattenKeypoints(subA);
    const flatB = flattenKeypoints(subB);
    const dot = flatA.reduce((acc, val, i) => acc + val * flatB[i], 0);
    const normA = Math.sqrt(flatA.reduce((acc, val) => acc + val * val, 0));
    const normB = Math.sqrt(flatB.reduce((acc, val) => acc + val * val, 0));
    let cosine: number;
    if (normA === 0 && normB === 0) {
      cosine = 1;
    } else if (normA === 0 || normB === 0) {
      cosine = 0;
    } else {
      cosine = dot / (normA * normB);
    }
    const scoreCosine = (cosine + 1) / 2;

    // 角度スコア：指根と指先の角度差
    const baseA = subA[0];
    const tipA = subA[subA.length - 1];
    const baseB = subB[0];
    const tipB = subB[subB.length - 1];
    const vecA = [tipA[0] - baseA[0], tipA[1] - baseA[1]];
    const vecB = [tipB[0] - baseB[0], tipB[1] - baseB[1]];
    const magA = Math.sqrt(vecA[0] ** 2 + vecA[1] ** 2);
    const magB = Math.sqrt(vecB[0] ** 2 + vecB[1] ** 2);
    let angleSim = 1;
    if (magA > 0 && magB > 0) {
      let diff = Math.abs(
        Math.atan2(vecA[1], vecA[0]) - Math.atan2(vecB[1], vecB[0]),
      );
      if (diff > Math.PI) {
        diff = 2 * Math.PI - diff;
      }
      angleSim = 1 - diff / Math.PI;
    }
    return (
      weightEuclidean * scoreEuclidean +
      weightCosine * scoreCosine +
      weightAngle * angleSim
    );
  }

  let bestGesture: string | null = null;
  let bestMinScore = -Infinity;

  for (const gesture of gestures) {
    const score = computeGestureScore(gesture);
    if (score !== null && score > bestMinScore) {
      bestMinScore = score;
      bestGesture = gesture.name;
    }
  }

  if (bestMinScore >= combinedThreshold) {
    return {
      gesture: bestGesture,
      score: bestMinScore,
      threshold: combinedThreshold,
      message: `ジェスチャー「${bestGesture}」を検出しました（スコア: ${bestMinScore.toFixed(3)}）`
    };
  } else {
    return {
      gesture: null,
      score: bestMinScore,
      threshold: combinedThreshold,
      message: `ジェスチャー認識失敗: スコア ${bestMinScore.toFixed(3)} < 閾値 ${combinedThreshold}`
    };
  }
}
