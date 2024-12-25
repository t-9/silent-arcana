// src/logic.ts
import { HandDetector, Hand } from '@tensorflow-models/hand-pose-detection';

/**
 * 推定結果から表示用の文字列を作る純粋関数
 */
export function handsToMessage(hands: Hand[]): string {
  if (!hands || hands.length === 0) {
    return '手が検出されていません';
  }

  const keypoints = hands[0].keypoints;
  const info = keypoints.map((k) => {
    const nm = k.name ?? 'point';
    const xCoord = k.x?.toFixed(2) ?? '0.00';
    const yCoord = k.y?.toFixed(2) ?? '0.00';
    return `${nm}: (${xCoord}, ${yCoord})`;
  });
  return `検出された手: ${info.join(', ')}`;
}

/**
 * 推論を一度だけ実行し、テキストを返す関数
 * - detector: 依存注入 (本物 or モック)
 * - video: カメラ映像を受け取るHTMLVideoElement (本物 or モック)
 */
export async function detectHandsOnce(
  detector: HandDetector,
  video: HTMLVideoElement
): Promise<string> {
  const hands = await detector.estimateHands(video);
  if (!hands || hands.length === 0) {
    return '手が検出されていません';
  }

  // ここで「最初の手」だけを判定対象にする例
  const keypoints = hands[0].keypoints;

  // [ [x,y], [x,y], ... ] に変換
  const arr = convertHandKeypointsToArray(keypoints);

  return `検出された手: ${JSON.stringify(arr)}`;
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
  detectedKeypoints: { x: number; y: number; name?: string }[]
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
 * wrist を原点(0,0)に合わせ、他の指の座標はそこからの相対位置に変換する。
 * 例: wristが (640, 350) なら、(650, 345) は (10, -5) になる。
 * さらに値を "ある程度" 正規化して小さくしたいなら、SCALE などで割る。
 */
export function toRelativeLandmarks(
  keypoints: Array<{ x: number; y: number; name?: string }>
): number[][] {
  // wristを探す
  const wrist = keypoints.find((pt) => pt.name === 'wrist');
  if (!wrist) {
    // wristが見つからない場合は、そのまま [ [x,y], ... ] に変換
    return keypoints.map((pt) => [pt.x, pt.y]);
  }

  const baseX = wrist.x;
  const baseY = wrist.y;

  // たとえばスケールを 1000 にしてみる (お好みで)
  const SCALE = 1000;

  return keypoints.map((pt) => {
    const dx = (pt.x - baseX) / SCALE;
    const dy = (pt.y - baseY) / SCALE;
    return [dx, dy];
  });
}