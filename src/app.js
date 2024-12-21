import {
  createDetector,
  SupportedModels
} from '@tensorflow-models/hand-pose-detection';

// WebGLバックエンドを使用 (必要に応じてCPUなど他のバックエンドを選択可)
import '@tensorflow/tfjs-backend-webgl';

let detector = null;
let videoEl = null;
let running = false;

/**
 * モデル読み込み
 */
async function loadModel() {
  detector = await createDetector(SupportedModels.MediaPipeHands, {
    runtime: 'tfjs',
    modelType: 'full' // 'lite' or 'full'
  });
  console.log("MediaPipe Handsモデル読み込み完了");
}

/**
 * カメラ開始
 */
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = stream;
    await new Promise(resolve => {
      videoEl.onloadedmetadata = () => resolve();
    });
    console.log("カメラ開始");
  } catch (err) {
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
    // hands[0].keypoints: 21点 (x, y, z, name)
    const keypoints = hands[0].keypoints;
    const info = keypoints.map(k => `${k.name}: (${k.x.toFixed(2)}, ${k.y.toFixed(2)})`);
    messageEl.textContent = `検出された手: ${info.join(", ")}`;
  } else {
    messageEl.textContent = "手が検出されていません";
  }

  requestAnimationFrame(detectLoop);
}

/**
 * 初期化
 */
async function init() {
  videoEl = document.getElementById('video');
  const startBtn = document.getElementById('start-btn');

  // モデル読み込み
  await loadModel();

  startBtn.addEventListener('click', async () => {
    if (!running) {
      await startCamera();
      running = true;
      detectLoop();
    }
  });
}

init();
