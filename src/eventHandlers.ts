// src/eventHandlers.ts
import { startCamera } from './cameraService';
import { startDetection, detectLoop, getDetector } from './modelService';
import { detectHandsOnce, toRelativeLandmarks } from './logic';

/**
 * キャプチャボタンを押したら、推定結果を1回取って console.log する
 */
export function setupCaptureButton(
  captureBtn: HTMLElement,
  videoEl: HTMLVideoElement,
) {
  captureBtn.addEventListener('click', async () => {
    const detector = getDetector(); // getDetector を使用
    if (!detector) {
      console.warn('No HandDetector is available yet.');
      return;
    }

    // 1回だけ推定を呼んでみる
    const message = await detectHandsOnce(detector, videoEl);

    console.log('detectHandsOnce message:', message);

    if (message.includes('手が検出されていません')) {
      console.warn('No hand detected');
      return;
    }

    const hands = await detector.estimateHands(videoEl);
    if (hands.length === 0) {
      console.warn('No hand detected (2nd check)');
      return;
    }

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
