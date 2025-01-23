import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { loadModel, startDetection, detectLoop } from './modelService';
import { getElement } from './domUtils';
import { setupKeyboardEvents } from './eventHandlers';
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
  // ゲームUI要素を取得
  const startGameBtn = getElement<HTMLButtonElement>('start-game-btn');
  const scoreDisplay = getElement<HTMLElement>('score-display');
  const gestureDisplay = getElement<HTMLElement>('gesture-display');
  const timerDisplay = getElement<HTMLElement>('timer-display');

  // 必須要素が見つからない場合はエラー
  if (!videoEl || !loadingEl || !messageEl) {
    console.error('DOM要素が見つからない');
    return;
  }
  if (!startGameBtn || !scoreDisplay || !gestureDisplay || !timerDisplay) {
    console.error('ゲームUI要素が見つかりません');
    return;
  }

  // ゲーム開始ボタンを一時的に無効化
  startGameBtn.disabled = true;

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

  // カメラを自動的に開始
  startDetection();
  try {
    await startCamera(videoEl, (text: string) => setLoadingText(loadingEl, text));
    detectLoop(videoEl, messageEl);
    // カメラの開始が成功したらボタンを有効化
    startGameBtn.disabled = false;
  } catch (error) {
    console.error('カメラの開始に失敗しました:', error);
    setLoadingText(messageEl, 'カメラの開始に失敗しました。ページを再読み込みしてください。');
  }

  // キーボードイベントの設定
  setupKeyboardEvents(videoEl);
}

// ブラウザ実行時のみ初期化
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  init();
}
