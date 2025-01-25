// src/eventHandlers.ts
import { getDetector } from './modelService';
import { detectHandsOnce } from './logic';

/**
 * キーボードイベントのセットアップ
 */
export function setupKeyboardEvents(videoEl: HTMLVideoElement): void {
  document.addEventListener('keydown', async (event) => {
    if (event.key === 'c') {
      const detector = getDetector();
      if (!detector) {
        console.log('No HandDetector is available yet.');
        return;
      }
      const message = await detectHandsOnce(detector, videoEl);
      console.log(message);
    }
  });
}
