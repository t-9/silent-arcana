import {
  createDetector,
  SupportedModels
} from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';

let detector = null;
let videoEl = null;
let running = false;

// 読み込み表示用の要素参照をキャッシュ
let loadingEl = null;

/** 
 * モデル読み込み
 */
export async function loadModel() {
  // ローディング開始表示
  loadingEl.textContent = 'モデル読み込み中...';

  detector = await createDetector(SupportedModels.MediaPipeHands, {
    runtime: 'tfjs',
    modelType: 'full'
  });

  console.log("MediaPipe Handsモデル読み込み完了");
  // ローディング完了表示を消す
  loadingEl.textContent = '';
  return detector;
}

/** 
 * MVP: カメラ開始
 */
async function startCamera() {
  try {
    loadingEl.textContent = 'カメラを起動しています...';

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = stream;
    await new Promise(resolve => {
      videoEl.onloadedmetadata = () => resolve();
    });

    console.log("カメラ開始");
    loadingEl.textContent = ''; // カメラ起動完了表示を消す
  } catch (err) {
    loadingEl.textContent = 'カメラの起動に失敗しました';
    console.error("カメラ使用許可が必要です:", err);
  }
}

/** 
 * 推定ループ 
 */
async function detectLoop() {
  if (!running || !detector) return;
  const hands = await detector.estimateHands(videoEl);
  const messageEl = document.getElementById('message');

  if (hands.length > 0) {
    const keypoints = hands[0].keypoints;
    const info = keypoints.map(k => `${k.name}: (${k.x.toFixed(2)}, ${k.y.toFixed(2)})`);
    messageEl.textContent = `検出された手: ${info.join(", ")}`;
  } else {
    messageEl.textContent = "手が検出されていません";
  }

  requestAnimationFrame(detectLoop);
}

/** 
 * メイン初期化 
 */
export async function init() {
  videoEl = document.getElementById('video');
  const startBtn = document.getElementById('start-btn');
  loadingEl = document.getElementById('loading');

  if (!videoEl || !startBtn || !loadingEl) {
    console.error("DOM要素が見つからない");
    return;
  }

  // まずモデルを読み込み（画面に「モデル読み込み中...」表示）
  await loadModel();

  // startBtnのクリックでカメラ開始＆ループ開始
  startBtn.addEventListener('click', async () => {
    if (!running) {
      await startCamera();
      running = true;
      detectLoop();
    }
  });
}

// ブラウザ実行時のみ自動呼び出し
if (typeof window !== 'undefined') {
  init();
}
