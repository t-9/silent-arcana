// src/modelService.ts
import { HandDetector } from '@tensorflow-models/hand-pose-detection';
import { createHandDetector } from './detectionModule';
import { handsToMessage } from './logic';

let detector: HandDetector | null = null;
let running = false;

/** モデルの読み込み */
export async function loadModel(setLoading: (text: string) => void): Promise<HandDetector> {
  setLoading('モデル読み込み中...');
  detector = await createHandDetector();
  console.log('MediaPipe Handsモデル読み込み完了');
  setLoading('');
  return detector;
}

/** 推定ループ (非同期で再帰呼び出し) */
export async function detectLoop(
  videoEl: HTMLVideoElement,
  messageEl: HTMLElement
): Promise<void> {
  if (!running || !detector) return;

  const hands = await detector.estimateHands(videoEl);
  messageEl.textContent = handsToMessage(hands);

  requestAnimationFrame(() => {
    detectLoop(videoEl, messageEl);
  });
}

/** 推定を開始する */
export function startDetection() {
  running = true;
}
export function stopDetection() {
  running = false;
}
