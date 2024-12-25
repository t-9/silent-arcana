// src/eventHandlers.ts
import { captureHandPose } from './captureService';
import { startCamera } from './cameraService';
import { startDetection, detectLoop } from './modelService';

// 既存の関数と同様に、新しく setupCaptureButton を定義
export function setupCaptureButton(
  captureBtn: HTMLElement,
  videoEl: HTMLVideoElement,
): void {
  captureBtn.addEventListener('click', async () => {
    // カメラが起動済み & detector読み込み済み という前提で
    // captureHandPoseを呼ぶ
    await captureHandPose(videoEl);
  });
}

// 他の既存の setupStartButton とかもそのまま
export function setupStartButton(
  startBtn: HTMLElement,
  captureBtn: HTMLButtonElement,
  videoEl: HTMLVideoElement,
  messageEl: HTMLElement,
  setLoadingText: (text: string) => void,
  startCameraFn = startCamera,
  startDetectionFn = startDetection,
  detectLoopFn = detectLoop
): void {
  startBtn.addEventListener('click', async () => {
    startDetectionFn();
    await startCameraFn(videoEl, setLoadingText);
    captureBtn.disabled = false;
    detectLoopFn(videoEl, messageEl);
  });
}
