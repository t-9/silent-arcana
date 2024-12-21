// src/app.ts
import '@tensorflow/tfjs-backend-webgl';
import { HandDetector } from '@tensorflow-models/hand-pose-detection';
import { createHandDetector } from './detectionModule';

let videoEl: HTMLVideoElement | null = null;
let loadingEl: HTMLElement | null = null;
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
  console.log("MediaPipe Handsモデル読み込み完了");

  setLoadingText('');
  return detector;
}

/**
 * カメラ開始
 */
export async function startCamera(): Promise<void> {
  setLoadingText('カメラを起動しています...');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log("Stream obtained:", stream); // デバッグログ
    if (videoEl) {
      console.log("Setting srcObject to videoEl", stream);
      videoEl.srcObject = stream;
      console.log("srcObject after setting:", videoEl.srcObject);
      await new Promise<void>((resolve) => {
        videoEl!.onloadedmetadata = () => {
          console.log("onloadedmetadata event fired");
          resolve();
        };
      });
    } else {
      console.error("videoEl is null or undefined");
    }
    console.log("カメラ開始");
    setLoadingText('');
  } catch (err) {
    console.error("カメラ使用許可が必要です:", err);
    setLoadingText('カメラの起動に失敗しました');
  }
}

/**
 * 推定ループ: detector.estimateHands(videoEl) で推定結果を取得し、画面に表示
 */
async function detectLoop(): Promise<void> {
  if (!running || !detector || !videoEl) return;

  // 手の推定結果を取得
  const hands = await detector.estimateHands(videoEl);
  const messageEl = document.getElementById('message');
  if (!messageEl) return;

  if (hands.length > 0) {
    // 最初の手の keypoints を文字列化
    const keypoints = hands[0].keypoints;
    const info = keypoints.map(k => {
      // name, x, y が undefinedの場合対策
      const nm = k.name ?? 'point';
      const xCoord = k.x?.toFixed(2) ?? '0.00';
      const yCoord = k.y?.toFixed(2) ?? '0.00';
      return `${nm}: (${xCoord}, ${yCoord})`;
    });
    messageEl.textContent = `検出された手: ${info.join(", ")}`;
  } else {
    messageEl.textContent = "手が検出されていません";
  }

  // ループ継続
  requestAnimationFrame(() => { detectLoop(); });
}

/**
 * メイン初期化
 */
export async function init(): Promise<void> {
  videoEl = document.getElementById('video') as HTMLVideoElement | null;
  const startBtn = document.getElementById('start-btn');
  loadingEl = document.getElementById('loading');

  if (!videoEl || !startBtn) {
    console.error("DOM要素が見つからない");
    return;
  }

  // 1) モデルを読み込み
  await loadModel();

  // 2) スタートボタンでカメラ開始 & 推定開始
  startBtn.addEventListener('click', async () => {
    if (!running) {
      await startCamera();
      running = true;
      detectLoop();
    }
  });
}

// ブラウザ実行時のみ自動呼び出し (テスト時に呼ばれないよう工夫するなら以下を削除か条件分岐)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  init();
}
