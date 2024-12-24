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
  return handsToMessage(hands);
}
