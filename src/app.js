import {
  createDetector,
  SupportedModels
} from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';

let detector = null;
let videoEl = null;
let loadingEl = null;
let running = false;

// テスト環境などで loadingEl が無い場合に備え、
// メッセージ更新を安全に行う別関数を定義
function setLoadingText(text) {
  if (loadingEl) {
    loadingEl.textContent = text;
  }
}

/**
 * モデル読み込み
 */
export async function loadModel() {
  setLoadingText('モデル読み込み中...');

  detector = await createDetector(SupportedModels.MediaPipeHands, {
    runtime: 'tfjs',
    modelType: 'full'
  });

  console.log("MediaPipe Handsモデル読み込み完了");
  setLoadingText(''); // 読み込み完了後、表示を消す

  return detector;
}

/**
 * カメラ開始
 */
async function startCamera() {
  setLoadingText('カメラを起動しています...');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = stream;
    await new Promise(resolve => {
      videoEl.onloadedmetadata = () => resolve();
    });
    console.log("カメラ開始");
    setLoadingText('');
  } catch (err) {
    console.error("カメラ使用許可が必要です:", err);
    setLoadingText('カメラの起動に失敗しました');
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
  loadingEl = document.getElementById('loading'); // ローディング表示用要素

  if (!videoEl || !startBtn) {
    console.error("DOM要素が見つからない");
    return;
  }

  // モデル読み込み
  await loadModel();

  // カメラ開始ボタン
  startBtn.addEventListener('click', async () => {
    if (!running) {
      await startCamera();
      running = true;
      detectLoop();
    }
  });
}

// ブラウザ実行時のみinit()呼び出し
if (typeof window !== 'undefined') {
  init();
}
