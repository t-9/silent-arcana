// src/app.ts
import '@tensorflow/tfjs-backend-webgl';
import { HandDetector } from '@tensorflow-models/hand-pose-detection';
import { createHandDetector } from './detectionModule';
import { getGetUserMedia } from './cameraModule';
import { handsToMessage } from './logic'; // (A)で作成した関数

let videoEl: HTMLVideoElement | null = null;
let loadingEl: HTMLElement | null = null;
let messageEl: HTMLElement | null = null; // 追加
let running = false;
let detector: HandDetector | null = null;

/**
 * ローディング表示の簡易ヘルパー
 */
function setLoadingText(text: string) {
  if (loadingEl) {
    loadingEl.textContent = text;
  }
}

/**
 * モデル読み込み (DI先の createHandDetector を呼ぶ)
 */
export async function loadModel(): Promise<HandDetector> {
  setLoadingText('モデル読み込み中...');
  detector = await createHandDetector();
  console.log('MediaPipe Handsモデル読み込み完了');
  setLoadingText('');
  return detector;
}

/**
 * カメラ開始 (getUserMediaを呼ぶ)
 */
export async function startCamera(): Promise<void> {
  setLoadingText('カメラを起動しています...');
  try {
    const stream = await getGetUserMedia()({ video: true });
    console.log('Stream obtained:', stream);

    if (!videoEl) {
      console.error('videoEl is null or undefined');
      return;
    }
    videoEl.srcObject = stream;
    await new Promise<void>((resolve) => {
      videoEl!.onloadedmetadata = () => resolve();
    });
    console.log('カメラ開始');
    setLoadingText('');
  } catch (err) {
    console.error('カメラ使用許可が必要です:', err);
    setLoadingText('カメラの起動に失敗しました');
  }
}

/**
 * 推定ループ (requestAnimationFrameを使う)
 */
async function detectLoop(): Promise<void> {
  if (!running || !detector || !videoEl || !messageEl) return;

  // 推論結果を取得 → メッセージ更新
  const hands = await detector.estimateHands(videoEl);
  messageEl.textContent = handsToMessage(hands);

  // ループ継続
  requestAnimationFrame(() => {
    detectLoop();
  });
}

/**
 * メイン初期化: DOM要素を取得し、イベントを設定
 */
export async function init(): Promise<void> {
  videoEl = document.getElementById('video') as HTMLVideoElement | null;
  loadingEl = document.getElementById('loading');
  messageEl = document.getElementById('message');
  const startBtn = document.getElementById('start-btn');

  if (!videoEl || !startBtn || !messageEl) {
    console.error('DOM要素が見つからない');
    return;
  }

  // (1) モデルを読み込み
  await loadModel();

  // (2) スタートボタンでカメラ開始 & 推定開始
  startBtn.addEventListener('click', async () => {
    if (!running) {
      await startCamera();
      running = true;
      detectLoop();
    }
  });
}

// ブラウザ実行時のみ自動呼び出し (テスト時に呼ばれないように条件分岐)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  init();
}
