/**
 * アプリケーションのメインモジュール
 * TensorFlow.js、カメラ、UI、ゲームロジックの初期化を行う
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { loadModel, startDetection, detectLoop } from './modelService';
import { getElement } from './domUtils';
import { setupKeyboardEvents } from './eventHandlers';
import { setLoadingText } from './uiUtils';
import { startCamera } from './cameraService';
import { setupGameUI } from './gameHandlers';
import { loadGestureData } from './gestureService';
import { preloadSounds } from './soundService';

/**
 * アプリケーションの初期化を行う
 * @returns {Promise<void>} 初期化の完了を示すPromise
 * @throws {Error} DOM要素が見つからない場合、またはゲームUI要素が見つからない場合
 * @description
 * 以下の初期化を順番に実行:
 * 1. TensorFlow.jsの初期化
 * 2. DOM要素の取得と検証
 * 3. サウンドファイルのプリロード
 * 4. 手検出モデルの読み込み
 * 5. ジェスチャーデータの読み込み
 * 6. カメラの起動
 * 7. UIイベントハンドラの設定
 */
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
    throw new Error('DOM要素が見つからない');
  }
  if (!startGameBtn || !scoreDisplay || !gestureDisplay || !timerDisplay) {
    console.error('ゲームUI要素が見つかりません');
    throw new Error('ゲームUI要素が見つかりません');
  }

  // ゲーム開始ボタンを一時的に無効化
  startGameBtn.disabled = true;

  try {
    // サウンドファイルをプリロード
    await preloadSounds();

    // モデルを読み込み
    await loadModel((text: string | boolean) =>
      setLoadingText(loadingEl, String(text)),
    );

    // 手話データを読み込み
    const gestures = await loadGestureData();
    if (!gestures || gestures.length === 0) {
      console.error('手話データの読み込みに失敗しました');
      setLoadingText(
        messageEl,
        '手話データの読み込みに失敗しました。ページを再読み込みしてください。',
      );
      throw new Error('手話データの読み込みに失敗しました');
    }

    // カメラを自動的に開始
    await startCamera(videoEl, (text: string | boolean) =>
      setLoadingText(loadingEl, String(text)),
    );
    startDetection();
    detectLoop(videoEl, messageEl);
    // カメラの開始が成功したらボタンを有効化
    startGameBtn.disabled = false;

    // ゲームUIの設定
    setupGameUI(
      startGameBtn,
      scoreDisplay,
      gestureDisplay,
      timerDisplay,
      gestures,
    );

    // キーボードイベントの設定
    setupKeyboardEvents(videoEl);
  } catch (error) {
    console.error('初期化に失敗しました:', error);
    setLoadingText(
      messageEl,
      '初期化に失敗しました。ページを再読み込みしてください。',
    );
    throw error;
  }
}

// ブラウザ実行時のみ初期化
if (
  typeof window !== 'undefined' &&
  process.env.NODE_ENV !== 'ci' &&
  process.env.NODE_ENV !== 'test'
) {
  init();
}
