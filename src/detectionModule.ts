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
 * 依存注入用の内部変数。初期値は本物の createDetector
 */
let _createDetector = realCreateDetector;

/**
 * getter関数: 外部から現在の createDetector を取得する
 */
export function getCreateDetector(): typeof realCreateDetector {
  return _createDetector;
}

/**
 * setter関数: テスト時などにモック版 createDetector を差し替える
 */
export function setCreateDetector(fn: typeof realCreateDetector) {
  _createDetector = fn;
}

/**
 * 実際にモデルを取得する関数
 * app.ts からはこれを呼ぶだけ
 */
export async function createHandDetector(): Promise<HandDetector> {
  const detector = await getCreateDetector()(
    SupportedModels.MediaPipeHands,
    defaultConfig,
  );
  return detector;
}
