// src/modelService.ts
import { HandDetector } from '@tensorflow-models/hand-pose-detection';
import { createHandDetector } from './detectionModule';
import { Gesture, loadGestureData, detectGesture } from './gestureService';

// (既存)
let detector: HandDetector | null = null;
let running = false;

// ★ 追加: ロードしたジェスチャーデータを保持しておく
let loadedGestures: Gesture[] = [];

// Detectorを外から取得するためのゲッター
export function getDetector(): HandDetector | null {
  return detector;
}

/**
 * モデルの読み込みと、手話用ジェスチャーデータの読み込み
 */
export async function loadModel(setLoading: (text: string) => void): Promise<HandDetector> {
  setLoading('モデル読み込み中...');
  detector = await createHandDetector();
  console.log('MediaPipe Handsモデル読み込み完了');
  setLoading('');

  // ★ 追加: ジェスチャーデータを読み込む
  // fetch で読み込む場合:
  //   loadedGestures = await loadGestureData('/templates/dummyGestures.json');
  // もし import で取得できる環境なら、gestureService.ts 内で
  //   import gestureData from '../templates/dummyGestures.json';
  // としておき、ここで
  //   loadedGestures = gestureData.gestures;
  // のようにセットしてもOK
  try {
    loadedGestures = await loadGestureData('/templates/dummyGestures.json');
    console.log('ジェスチャーデータ読み込み完了:', loadedGestures);
  } catch (e) {
    console.error('ジェスチャーデータの読み込みに失敗:', e);
  }

  return detector;
}

/**
 * 推定ループ (非同期で再帰呼び出し)
 */
export async function detectLoop(
  videoEl: HTMLVideoElement,
  messageEl: HTMLElement
): Promise<void> {
  if (!running || !detector) return;

  // 手の推定
  const hands = await detector.estimateHands(videoEl);

  // 既存ロジック: keypointsをメッセージに表示
  // messageEl.textContent = handsToMessage(hands);

  // ここに手話判定を追加
  if (hands && hands.length > 0) {
    // 手はひとまず1つだけ処理
    const gestureName = detectGesture(hands[0].keypoints, loadedGestures);
    if (gestureName) {
      messageEl.textContent = `検出された手話: ${gestureName}`;
    } else {
      messageEl.textContent = '該当する手話が見つかりません';
    }
  } else {
    messageEl.textContent = '手が検出されていません';
  }

  // 再帰的に呼び出してループ
  requestAnimationFrame(() => {
    detectLoop(videoEl, messageEl);
  });
}

/** 推定を開始する */
export function startDetection() {
  running = true;
}

/** 推定を停止する */
export function stopDetection() {
  running = false;
}
