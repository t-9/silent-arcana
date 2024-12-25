import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { loadModel, startDetection, detectLoop } from './modelService';
import { getElement } from './domUtils';
import { setupStartButton } from './eventHandlers';
import { setLoadingText } from './uiUtils';
import { startCamera } from './cameraService';

export async function init(): Promise<void> {
  await tf.setBackend('webgl');
  await tf.ready();

  const videoEl = getElement<HTMLVideoElement>('video');
  const loadingEl = getElement<HTMLElement>('loading');
  const messageEl = getElement<HTMLElement>('message');
  const startBtn = getElement<HTMLElement>('start-btn');

  if (!videoEl || !loadingEl || !messageEl || !startBtn) {
    console.error('DOM要素が見つからない');
    return;
  }

  // モデル読み込み
  await loadModel((text: string) => setLoadingText(loadingEl, text));

  // スタートボタンの設定
  setupStartButton(
    startBtn,
    videoEl,
    messageEl,
    (text: string) => setLoadingText(loadingEl, text),
    startCamera,
    startDetection,
    detectLoop
  );
}

// ブラウザ実行時のみ
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  init();
}
