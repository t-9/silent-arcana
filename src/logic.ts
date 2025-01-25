// src/logic.ts
import { HandDetector, Hand } from '@tensorflow-models/hand-pose-detection';
import { getGestures, getCurrentGesture, isGameRunning, updateScore } from './gameState';
import { detectGesture } from './gestureService';

/**
 * 推定結果から表示用の文字列を作る純粋関数
 */
export function handsToMessage(hands: Hand[]): string {
  if (!hands || hands.length === 0) {
    return '手が検出されていません';
  }
  return '手が検出されました';
}

/**
 * 推論を一度だけ実行し、テキストを返す関数
 * - detector: 依存注入 (本物 or モック)
 * - video: カメラ映像を受け取るHTMLVideoElement (本物 or モック)
 */
export async function detectHandsOnce(
  detector: HandDetector,
  video: HTMLVideoElement,
): Promise<string> {
  const hands = await detector.estimateHands(video);
  if (!hands || hands.length === 0) {
    return '手が検出されていません';
  }

  // ここで「最初の手」だけを判定対象にする
  const keypoints = hands[0].keypoints;
  console.log('Raw keypoints:', keypoints);

  const rel = toRelativeLandmarks(keypoints);
  console.log('Relative landmarks:', rel);

  // ジェスチャー検出と得点更新
  const gestures = getGestures();
  console.log('Available gestures:', gestures);

  if (gestures && gestures.length > 0) {
    const detectedGesture = detectGesture(rel, gestures);
    const currentGesture = getCurrentGesture();
    console.log('Current gesture:', currentGesture);
    console.log('Detected gesture:', detectedGesture);

    if (detectedGesture && currentGesture === detectedGesture && isGameRunning()) {
      console.log('Score updated!');
      updateScore();
    }
  }

  return '手が検出されました';
}

// 2) dummyGestures.json の 21 keypoints 順序に対応したキー名一覧を定義
//    MediaPipeHands が出す name と揃っていることが重要です
const KEYPOINT_ORDER = [
  'wrist',
  'thumb_cmc',
  'thumb_mcp',
  'thumb_ip',
  'thumb_tip',
  'index_finger_mcp',
  'index_finger_pip',
  'index_finger_dip',
  'index_finger_tip',
  'middle_finger_mcp',
  'middle_finger_pip',
  'middle_finger_dip',
  'middle_finger_tip',
  'ring_finger_mcp',
  'ring_finger_pip',
  'ring_finger_dip',
  'ring_finger_tip',
  'pinky_finger_mcp',
  'pinky_finger_pip',
  'pinky_finger_dip',
  'pinky_finger_tip',
];

/**
 * 推定結果 keypoints: {x, y, name} の配列を
 * dummyGestures と同じ [ [x, y], ..., [x, y] ] の形に変換し、
 * かつ keypoint の順序 (KEYPOINT_ORDER) を揃えて返す
 */
export function convertHandKeypointsToArray(
  detectedKeypoints: { x: number; y: number; name?: string }[],
): number[][] {
  const result: number[][] = [];

  for (const kpName of KEYPOINT_ORDER) {
    // name:kpName が見つかったらそれを [x, y] として追加
    const match = detectedKeypoints.find((k) => k.name === kpName);
    if (match) {
      result.push([match.x, match.y]);
    } else {
      // 見つからなければ [0, 0] 等で埋める
      result.push([0, 0]);
    }
  }
  return result;
}

/**
 * キーポイントを相対座標に変換する
 */
export function toRelativeLandmarks(keypoints: { x: number; y: number; name?: string }[]): number[][] {
  // まずキーポイントを配列形式に変換
  const points = convertHandKeypointsToArray(keypoints);

  // 手首の位置を基準点として取得
  const wrist = points[0];  // KEYPOINT_ORDERの最初が'wrist'

  // 手首を原点とした相対座標に変換
  const relativePoints = points.map(point => [
    point[0] - wrist[0],
    point[1] - wrist[1]
  ]);

  // 相対座標の最大絶対値を計算
  const absValues = relativePoints.flatMap(p => [Math.abs(p[0]), Math.abs(p[1])]);
  const maxAbs = Math.max(...absValues);

  // スケール係数を計算（最大絶対値が2になるように）
  const SCALE = maxAbs / 2;

  // デバッグ用のログ
  console.log('Before normalization:', {
    maxAbs,
    SCALE,
    points: relativePoints
  });

  // 正規化（-2から2の範囲に収める）
  const normalizedPoints = relativePoints.map(point => [
    point[0] / SCALE,
    point[1] / SCALE
  ]);

  // デバッグ用のログ
  const xValues = normalizedPoints.map(p => p[0]);
  const yValues = normalizedPoints.map(p => p[1]);
  console.log('After normalization:', {
    x: { min: Math.min(...xValues), max: Math.max(...xValues) },
    y: { min: Math.min(...yValues), max: Math.max(...yValues) }
  });

  return normalizedPoints;
}
