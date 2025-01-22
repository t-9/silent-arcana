import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { loadModel, startDetection, detectLoop } from './modelService';
import { getElement } from './domUtils';
import { setupStartButton, setupCaptureButton } from './eventHandlers';
import { setLoadingText } from './uiUtils';
import { startCamera } from './cameraService';
import { setupGameUI } from './gameHandlers';
import { loadGestureData } from './gestureService';

export async function init(): Promise<void> {
  // TensorFlowの初期化
  await tf.setBackend('webgl');
  await tf.ready();

  // DOM要素を取得
  const videoEl = getElement<HTMLVideoElement>('video');
  const loadingEl = getElement<HTMLElement>('loading');
  const messageEl = getElement<HTMLElement>('message');
  const startBtn = getElement<HTMLElement>('start-btn');
  const captureBtn = getElement<HTMLButtonElement>('capture-btn');
  // ゲームUI要素を取得
  const startGameBtn = getElement<HTMLButtonElement>('start-game-btn');
  const scoreDisplay = getElement<HTMLElement>('score-display');
  const gestureDisplay = getElement<HTMLElement>('gesture-display');
  const timerDisplay = getElement<HTMLElement>('timer-display');

  // 必須要素が見つからない場合はエラー
  if (!videoEl || !loadingEl || !messageEl || !startBtn || !captureBtn) {
    console.error('DOM要素が見つからない');
    return;
  }
  if (!startGameBtn || !scoreDisplay || !gestureDisplay || !timerDisplay) {
    console.error('ゲームUI要素が見つかりません');
    return;
  }

  // モデルを読み込み
  await loadModel((text: string) => setLoadingText(loadingEl, text));

  const gestures = await loadGestureData('./templates/normalizedGestures.json');
  setupGameUI(
    startGameBtn,
    scoreDisplay,
    gestureDisplay,
    timerDisplay,
    gestures,
  );

  // カメラ開始後に`detectLoop`を呼び出す
  setupStartButton({
    startBtn,
    captureBtn,
    videoEl,
    messageEl,
    setLoadingText: (text: string) => setLoadingText(loadingEl, text),
    startCameraFn: async (video, setLoading) => {
      await startCamera(video, setLoading); // カメラの初期化
      startDetection(); // 推定を開始
      detectLoop(video, messageEl); // 検出ループを開始
    },
    startDetectionFn: startDetection,
    detectLoopFn: detectLoop, // そのまま`detectLoop`を渡す
  });

  // キャプチャボタンを設定
  setupCaptureButton(captureBtn, videoEl);
}

// ブラウザ実行時のみ初期化
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  init();
}
