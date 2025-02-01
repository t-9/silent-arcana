// src/gestureService.ts

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
 * 各指ごとにユークリッド距離、コサイン類似度、角度差によるスコアを計算し、
 * その各指のスコアの最小値（＝最も弱い指のスコア）を全体の評価スコアとする。
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
  if (!keypoints || keypoints.length === 0 || !gestures || gestures.length === 0) {
    console.log('Invalid input:', { keypoints, gestures });
    return null;
  }

  // 各指のグループ（手首（index 0）は除く）：
  // 1～4: 親指、5～8: 人差し指、9～12: 中指、13～16: 薬指、17～20: 小指
  const fingerGroups = [
    [1, 2, 3, 4],    // 親指
    [5, 6, 7, 8],    // 人差し指
    [9, 10, 11, 12], // 中指
    [13, 14, 15, 16],// 薬指
    [17, 18, 19, 20] // 小指
  ];

  let bestGesture: string | null = null;
  let bestMinScore = -Infinity;

  // ヘルパー関数：指定されたインデックスの点群を取得
  function getFingerPoints(points: number[][], indices: number[]): number[][] {
    return indices.map(i => points[i] ? points[i] : [0, 0, 0]);
  }

  // ヘルパー関数：ユークリッド距離からスコアを算出
  const scoreFromDistance = (dist: number): number => {
    return Math.max(0, (distanceThreshold - dist) / distanceThreshold);
  };

  // ヘルパー関数：各サブ配列を必ず3要素に補完して平坦化
  function flattenKeypoints(points: number[][]): number[] {
    return points
      .map(pt => {
        if (pt.length < 3) {
          return [...pt, ...Array(3 - pt.length).fill(0)];
        }
        return pt;
      })
      .flat();
  }

  // ヘルパー関数：2つの点群間のユークリッド距離を計算
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

  // 各候補ジェスチャーについて評価する
  for (const gesture of gestures) {
    let fingerScores: number[] = [];

    for (const group of fingerGroups) {
      const subA = getFingerPoints(keypoints, group);
      const subB = getFingerPoints(gesture.landmarks, group);
      if (subA.length !== group.length || subB.length !== group.length) {
        console.warn(`キー点数が一致しません: gesture ${gesture.name}`);
        continue;
      }

      // ユークリッド距離によるスコア
      const dist = calcDistance(subA, subB);
      const scoreEuclidean = scoreFromDistance(dist);

      // コサイン類似度によるスコア
      const flatA = flattenKeypoints(subA);
      const flatB = flattenKeypoints(subB);
      if (flatA.length !== flatB.length) {
        console.warn(`キー点数が一致しません: gesture ${gesture.name}`);
        continue;
      }
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

      // 角度によるスコア
      // ここでは、各指グループの「指根」と「指先」をそれぞれグループの最初と最後の点とする
      const baseA = subA[0];
      const tipA = subA[subA.length - 1];
      const baseB = subB[0];
      const tipB = subB[subB.length - 1];

      // ベクトル計算
      const vecA = [tipA[0] - baseA[0], tipA[1] - baseA[1]];
      const vecB = [tipB[0] - baseB[0], tipB[1] - baseB[1]];

      const magA = Math.sqrt(vecA[0] * vecA[0] + vecA[1] * vecA[1]);
      const magB = Math.sqrt(vecB[0] * vecB[0] + vecB[1] * vecB[1]);

      let angleSim = 1; // もしどちらかの指が無効（大きさが0）なら角度は一致とみなす
      if (magA > 0 && magB > 0) {
        const angleA = Math.atan2(vecA[1], vecA[0]);
        const angleB = Math.atan2(vecB[1], vecB[0]);
        let diff = Math.abs(angleA - angleB);
        // 角度差を [0, π] の範囲にする
        if (diff > Math.PI) {
          diff = 2 * Math.PI - diff;
        }
        angleSim = 1 - diff / Math.PI; // 0～1のスコア（完全一致なら1, 180°ずれていれば0）
      }

      const fingerScore =
        weightEuclidean * scoreEuclidean +
        weightCosine * scoreCosine +
        weightAngle * angleSim;
      fingerScores.push(fingerScore);
    }

    // 各指のスコアのうち最も低い値を、そのジェスチャーの評価スコアとする
    const overallScore = Math.min(...fingerScores);
    console.log(
      `Gesture "${gesture.name}": Min Finger Score = ${overallScore.toFixed(3)}`
    );

    if (overallScore > bestMinScore) {
      bestMinScore = overallScore;
      bestGesture = gesture.name;
    }
  }

  return bestMinScore >= combinedThreshold ? bestGesture : null;
}
