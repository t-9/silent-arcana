// src/eventHandlers.ts
import { startCamera } from './cameraService';
import { startDetection, detectLoop } from './modelService';
import { detectHandsOnce, toRelativeLandmarks } from './logic';

/**
 * キャプチャボタンを押したら、推定結果を1回取って console.log するサンプル
 * - detectorは modelService.ts で作ったグローバル変数 "detector" を利用してもよいが、
 *   ここでは簡単のため detectHandsOnce を呼んでしまう。
 */
export function setupCaptureButton(
  captureBtn: HTMLElement,
  videoEl: HTMLVideoElement
) {
  captureBtn.addEventListener('click', async () => {
    // 1回だけ推定を呼んでみる
    const message = await detectHandsOnce(
      // detectHandsOnceの第一引数はHandDetector
      // modelServiceの中で detector が export されているならそれをimportして使う、あるいは別の方法でもOK
      // 例: import { detector } from './modelService';
      // ただしdetectorがnullの場合があるので注意
      // ここでは裏で動いている想定として単純例にします
      // -----------------------------------------------------
      window['detector'], // or from modelService
      videoEl
    );

    console.log('detectHandsOnce message:', message);

    // ここで "手が検出されていません" の場合は弾く
    if (message.includes('手が検出されていません')) {
      console.warn('No hand detected');
      return;
    }

    // すでに modelService.ts の "detectHandsOnce" は "handsToMessage(hands)" を返すだけ。
    // 実際は "hands" を丸ごと取得したい。
    // なので detectHandsOnce の実装を少し変える or 自前で estimateHands を呼んでもOKです。
    // -----------------------------------------------------
    // 例: detector.estimateHands(videoEl) を直接呼ぶ
    const detector = window['detector']; // or however you get it
    if (!detector) {
      console.warn('No HandDetector is available yet.');
      return;
    }

    const hands = await detector.estimateHands(videoEl);
    if (hands.length === 0) {
      console.warn('No hand detected (2nd check)');
      return;
    }

    // 1つ目の手の keypoints を相対座標に
    const rel = toRelativeLandmarks(hands[0].keypoints);

    console.log('相対座標( [ [dx, dy], ... ] ):', rel);
    console.log('JSON形式で出すなら:', JSON.stringify(rel));
  });
}

type SetupStartButtonOptions = {
  startBtn: HTMLElement;
  captureBtn: HTMLButtonElement;
  videoEl: HTMLVideoElement;
  messageEl: HTMLElement;
  setLoadingText: (text: string) => void;
  startCameraFn?: typeof startCamera;
  startDetectionFn?: typeof startDetection;
  detectLoopFn?: typeof detectLoop;
};

export function setupStartButton({
  startBtn,
  captureBtn,
  videoEl,
  messageEl,
  setLoadingText,
  startCameraFn = startCamera,
  startDetectionFn = startDetection,
  detectLoopFn = detectLoop,
}: SetupStartButtonOptions): void {
  startBtn.addEventListener('click', async () => {
    startDetectionFn();
    await startCameraFn(videoEl, setLoadingText);
    captureBtn.disabled = false;
    detectLoopFn(videoEl, messageEl);
  });
}