// src/eventHandlers.ts
/**
 * アプリケーションのイベントハンドラを管理するモジュール
 */

import { getDetector } from './detection/modelService';
import { detectHandsOnce } from './logic';

/**
 * キーボードイベントのリスナーを設定する
 * @param {HTMLVideoElement} videoEl - カメラ映像を表示するビデオ要素
 * @description 'c'キーを押下すると手の検出を実行する
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
