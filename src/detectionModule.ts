// src/detectionModule.ts
import {
  createDetector as realCreateDetector,
  SupportedModels,
  HandDetector,
} from '@tensorflow-models/hand-pose-detection';

// デフォルト設定
const defaultConfig = {
  runtime: 'tfjs' as const,
  modelType: 'full' as const,
};


/**
 * 依存注入用の変数。初期値は本物の createDetector
 */
export let createDetector = realCreateDetector;

/**
 * setter関数: テスト時などにモック版 createDetector を差し替える
 */
export function setCreateDetector(fn: typeof realCreateDetector) {
  createDetector = fn;
}

/**
 * 実際にモデルを取得する関数
 * app.ts からはこれを呼ぶだけ
 */
export async function createHandDetector(): Promise<HandDetector> {
  const detector = await createDetector(SupportedModels.MediaPipeHands, defaultConfig);
  return detector;
}
