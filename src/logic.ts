// src/logic.ts
/**
 * 手の検出とジェスチャー認識に関する主要なロジックを提供するモジュール
 */

import { HandDetector, Hand } from '@tensorflow-models/hand-pose-detection';
import {
  getGestures,
  getCurrentGesture,
  isGameRunning,
  updateScore,
} from './gameState';
import { detectGesture } from './gestureService';

interface ExtendedHand extends Hand {
  keypoints3D?: { x: number; y: number; z?: number }[];
}

/**
 * 検出された手の情報から表示用メッセージを生成する
 * @param {Hand[]} hands - 検出された手の配列
 * @returns {string} 手の検出状態を示すメッセージ
 */
export function handsToMessage(hands: Hand[]): string {
  if (!hands || hands.length === 0) {
    return '手が検出されていません';
  }
  return '手が検出されました';
}

/**
 * カメラ映像から1フレームの手の検出を実行する
 * @param {HandDetector} detector - TensorFlow.jsの手検出モデル
 * @param {HTMLVideoElement} video - カメラ映像を表示するビデオ要素
 * @returns {Promise<string>} 検出結果を示すメッセージ
 */
export async function detectHandsOnce(
  detector: HandDetector,
  video: HTMLVideoElement,
): Promise<string> {
  const hands = await detector.estimateHands(video);
  if (!hands || hands.length === 0) {
    return '手が検出されていません';
  }
  // ExtendedHand としてキャストする
  const hand = hands[0] as ExtendedHand;
  const keypoints = hand.keypoints3D ?? hand.keypoints;

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

    if (
      detectedGesture &&
      currentGesture === detectedGesture &&
      isGameRunning()
    ) {
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
 * 検出されたキーポイントを配列形式に変換する
 * @param {Array<{x: number, y: number, z?: number, name?: string}>} detectedKeypoints - 検出されたキーポイント
 * @returns {number[][]} 変換された座標配列
 */
export function convertHandKeypointsToArray(
  detectedKeypoints: { x: number; y: number; z?: number; name?: string }[],
): number[][] {
  const result: number[][] = [];

  for (const kpName of KEYPOINT_ORDER) {
    const match = detectedKeypoints.find((k) => k.name === kpName);
    if (match) {
      // z が存在しない場合は 0 を補完
      result.push([match.x, match.y, match.z ?? 0]);
    } else {
      result.push([0, 0, 0]);
    }
  }
  return result;
}

/**
 * キーポイントを相対座標に変換する
 * @param {Array<{x: number, y: number, z?: number, name?: string}>} keypoints - 変換するキーポイント
 * @returns {number[][]} 相対座標に変換されたキーポイント配列
 */
export function toRelativeLandmarks(
  keypoints: { x: number; y: number; z?: number; name?: string }[],
): number[][] {
  const points = convertHandKeypointsToArray(keypoints);
  const wrist = points[0]; // ここでは [x, y, z] として扱う

  // 手首を原点とした相対座標に変換（zも含む）
  const relativePoints = points.map((point) => [
    point[0] - wrist[0],
    point[1] - wrist[1],
    point[2] - wrist[2],
  ]);

  // 各成分の絶対値の最大値を取得（3次元全体から求める）
  const absValues = relativePoints.flatMap((p) => [
    Math.abs(p[0]),
    Math.abs(p[1]),
    Math.abs(p[2]),
  ]);
  const maxAbs = Math.max(...absValues);
  const SCALE = maxAbs;

  // 正規化：各成分を SCALE で割る
  const normalizedPoints = relativePoints.map((point) => [
    point[0] / SCALE,
    point[1] / SCALE,
    point[2] / SCALE,
  ]);

  return normalizedPoints;
}
