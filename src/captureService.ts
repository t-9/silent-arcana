// src/captureService.ts
import { getDetector } from './modelService';
import { convertHandKeypointsToArray } from './logic';
// ↑ modelService.ts 側に getDetector() など、今使っている HandDetector を返す関数を作っておくと便利
//   例: export function getDetector() { return detector; }

export async function captureHandPose(videoEl: HTMLVideoElement): Promise<void> {
  const detector = getDetector();
  if (!detector) {
    console.warn('Detector not loaded yet!');
    return;
  }

  // カメラ映像から推定
  const hands = await detector.estimateHands(videoEl);

  if (!hands || hands.length === 0) {
    console.log('手が検出されませんでした。もう一度試してください。');
    return;
  }

  // 1つ目の手を取得
  const keypoints = hands[0].keypoints;

  const arrayFormat = convertHandKeypointsToArray(keypoints);

  // JSON文字列としてコンソールに出力し、あとでコピペできるように
  console.log('--- Hand Keypoints JSON ---');
  console.log(JSON.stringify(arrayFormat));
  console.log('--- ここをコピーして JSON に貼り付けてください ---');
}
