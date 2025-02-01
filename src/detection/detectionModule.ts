// src/detectionModule.ts
/**
 * 手の検出モデルの作成と管理を行うモジュール
 * TensorFlow.jsのMediaPipeHandsモデルを使用
 */

import {
  createDetector as realCreateDetector,
  SupportedModels,
  HandDetector,
} from '@tensorflow-models/hand-pose-detection';

/**
 * デフォルトの検出器設定
 * @type {{runtime: 'tfjs', modelType: 'full'}}
 */
const defaultConfig = {
  runtime: 'tfjs' as const,
  modelType: 'full' as const,
};

/**
 * 依存注入用の内部変数
 * @type {typeof realCreateDetector}
 */
let _createDetector = realCreateDetector;

/**
 * 現在の検出器作成関数を取得する
 * @returns {typeof realCreateDetector} 現在の検出器作成関数
 */
export function getCreateDetector(): typeof realCreateDetector {
  return _createDetector;
}

/**
 * 検出器作成関数を設定する（主にテスト用）
 * @param {typeof realCreateDetector} fn - 設定する検出器作成関数
 */
export function setCreateDetector(fn: typeof realCreateDetector) {
  _createDetector = fn;
}

/**
 * MediaPipeHandsモデルを使用して手の検出器を作成する
 * @returns {Promise<HandDetector>} 作成された手の検出器
 */
export async function createHandDetector(): Promise<HandDetector> {
  const detector = await getCreateDetector()(
    SupportedModels.MediaPipeHands,
    defaultConfig,
  );
  return detector;
}
