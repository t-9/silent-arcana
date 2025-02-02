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
 * @returns 検出されたジェスチャーの名前、または認識失敗時は null
 */
export function detectGesture(
  keypoints: number[][],
  gestures: Gesture[],
  distanceThreshold = 20000.0,
  combinedThreshold = 0.8,
  weightEuclidean = 0.3,
  weightCosine = 0.4,
  weightAngle = 0.3,
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

  // 各指グループ（手首（index 0）は除く）
  const fingerGroups = [
    [1, 2, 3, 4], // 親指
    [5, 6, 7, 8], // 人差し指
    [9, 10, 11, 12], // 中指
    [13, 14, 15, 16], // 薬指
    [17, 18, 19, 20], // 小指
  ];

  let bestGesture: string | null = null;
  let bestMinScore = -Infinity;

  // 指定されたインデックス群から元の配列の値を取り出す関数
  function getFingerPoints(
    points: number[][],
    indices: number[],
  ): (number[] | undefined)[] {
    return indices.map((i) => points[i]);
  }

  // ユークリッド距離からスコアを算出
  const scoreFromDistance = (dist: number): number => {
    return Math.max(0, (distanceThreshold - dist) / distanceThreshold);
  };

  // 各サブ配列を必ず長さ3の数値配列に補完しつつ平坦化する
  function flattenKeypoints(points: number[][]): number[] {
    return points
      .map((pt) => {
        if (!pt || pt.length < 3) {
          return undefined; // 不正な点の場合は undefined にする
        }
        return pt;
      })
      .filter((pt): pt is number[] => pt !== undefined)
      .map((pt) => {
        return pt;
      })
      .flat();
  }

  // 2つの点群間のユークリッド距離を計算
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

  // 各候補ジェスチャーについて評価
  for (const gesture of gestures) {
    let validGesture = true; // このジェスチャーが全グループとも有効かどうか
    let fingerScores: number[] = [];

    for (const group of fingerGroups) {
      const subA = getFingerPoints(keypoints, group);
      const subB = getFingerPoints(gesture.landmarks, group);
      // キーポイントが不足している場合はジェスチャー全体を無効とする
      if (
        subA.some((pt) => !pt || pt.length !== 3) ||
        subB.some((pt) => !pt || pt.length !== 3)
      ) {
        console.warn(`キー点数が一致しません: gesture ${gesture.name}`);
        validGesture = false;
        break;
      }

      // ユークリッド距離
      const dist = calcDistance(subA as number[][], subB as number[][]);
      const scoreEuclidean = scoreFromDistance(dist);

      // 平坦化してコサイン類似度を計算
      const flatA = flattenKeypoints(subA as number[][]);
      const flatB = flattenKeypoints(subB as number[][]);
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

      // 角度スコア：指根と指先
      const baseA = subA[0] as number[];
      const tipA = subA[subA.length - 1] as number[];
      const baseB = subB[0] as number[];
      const tipB = subB[subB.length - 1] as number[];
      const vecA = [tipA[0] - baseA[0], tipA[1] - baseA[1]];
      const vecB = [tipB[0] - baseB[0], tipB[1] - baseB[1]];
      const magA = Math.sqrt(vecA[0] ** 2 + vecA[1] ** 2);
      const magB = Math.sqrt(vecB[0] ** 2 + vecB[1] ** 2);
      let angleSim = 1;
      if (magA > 0 && magB > 0) {
        const angleA = Math.atan2(vecA[1], vecA[0]);
        const angleB = Math.atan2(vecB[1], vecB[0]);
        let diff = Math.abs(angleA - angleB);
        if (diff > Math.PI) {
          diff = 2 * Math.PI - diff;
        }
        angleSim = 1 - diff / Math.PI;
      }

      // 各指グループの統合スコア
      const fingerScore =
        weightEuclidean * scoreEuclidean +
        weightCosine * scoreCosine +
        weightAngle * angleSim;
      fingerScores.push(fingerScore);
    }

    // このジェスチャー内で1つでもグループが不正なら評価しない
    if (!validGesture) {
      continue;
    }

    if (fingerScores.length === 0) {
      continue;
    }

    const overallScore = Math.min(...fingerScores);
    console.log(
      `Gesture "${gesture.name}": Min Finger Score = ${overallScore.toFixed(3)}`,
    );
    if (overallScore > bestMinScore) {
      bestMinScore = overallScore;
      bestGesture = gesture.name;
    }
  }

  return bestMinScore >= combinedThreshold ? bestGesture : null;
}
