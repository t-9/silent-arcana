// src/eventHandlers.ts
import { startCamera } from './cameraService';
import { startDetection, detectLoop, getDetector } from './modelService';
import { detectHandsOnce, toRelativeLandmarks } from './logic';

/**
 * キャプチャ処理の実行関数
 */
async function executeCapture(videoEl: HTMLVideoElement) {
  const detector = getDetector();
  if (!detector) {
    console.warn('No HandDetector is available yet.');
    return;
  }

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

  console.log(JSON.stringify(rel));
}

/**
 * キーボードイベントの設定
 */
export function setupKeyboardEvents(videoEl: HTMLVideoElement): void {
  document.addEventListener('keydown', async (event) => {
    if (event.key.toLowerCase() === 'c') {
      await executeCapture(videoEl);
    }
  });
}

type SetupStartButtonOptions = {
  startBtn: HTMLElement;
  videoEl: HTMLVideoElement;
  messageEl: HTMLElement;
  setLoadingText: (text: string) => void;
  startCameraFn?: typeof startCamera;
  startDetectionFn?: typeof startDetection;
  detectLoopFn?: typeof detectLoop;
};

export function setupStartButton({
  startBtn,
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
    detectLoopFn(videoEl, messageEl);
  });
}
