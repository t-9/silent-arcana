import { startDetection, detectLoop } from './modelService';
import { startCamera } from './cameraService';

export function setupStartButton(
  startBtn: HTMLElement,
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
    detectLoopFn(videoEl, messageEl);
  });
}
