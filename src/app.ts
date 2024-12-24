// src/app.ts
import { loadModel, startDetection, detectLoop } from './modelService';
import { startCamera } from './cameraService';

let videoEl: HTMLVideoElement | null = null;
let loadingEl: HTMLElement | null = null;
let messageEl: HTMLElement | null = null;

function setLoadingText(text: string) {
  if (loadingEl) loadingEl.textContent = text;
}

export async function init(): Promise<void> {
  videoEl = document.getElementById('video') as HTMLVideoElement;
  loadingEl = document.getElementById('loading');
  messageEl = document.getElementById('message');
  const startBtn = document.getElementById('start-btn');

  if (!videoEl || !loadingEl || !messageEl || !startBtn) {
    console.error('DOM要素が見つからない');
    return;
  }

  // モデル読み込み
  await loadModel(setLoadingText);

  // スタートボタン
  startBtn.addEventListener('click', async () => {
    // 依然として "running" を modelService 内部で管理すると仮定
    // ここで startDetection()
    startDetection();

    // カメラ開始
    await startCamera(videoEl!, setLoadingText);

    // 推定開始
    detectLoop(videoEl!, messageEl!);
  });
}

// ブラウザ実行時のみ
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  init();
}
