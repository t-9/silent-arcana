import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { loadModel, startDetection, detectLoop } from './modelService';
import { getElement } from './domUtils';
import { setupStartButton, setupCaptureButton } from './eventHandlers';
import { setLoadingText } from './uiUtils';
import { startCamera } from './cameraService';

export async function init(): Promise<void> {
  await tf.setBackend('webgl');
  await tf.ready();

  const videoEl = getElement<HTMLVideoElement>('video');
  const loadingEl = getElement<HTMLElement>('loading');
  const messageEl = getElement<HTMLElement>('message');
  const startBtn = getElement<HTMLElement>('start-btn');
  const captureBtn = getElement<HTMLElement>('capture-btn');

  if (!videoEl || !loadingEl || !messageEl || !startBtn || !captureBtn) {
    console.error('DOM要素が見つからない');
    return;
  }

  // モデル読み込み
  await loadModel((text: string) => setLoadingText(loadingEl, text));

  // スタートボタンの設定
  setupStartButton({
    startBtn,
    captureBtn: captureBtn as HTMLButtonElement,
    videoEl,
    messageEl,
    setLoadingText: (text: string) => setLoadingText(loadingEl, text),
    startCameraFn: startCamera,
    startDetectionFn: startDetection,
    detectLoopFn: detectLoop,
  });

  setupCaptureButton(captureBtn, videoEl);
}

// ブラウザ実行時のみ
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  init();
}
