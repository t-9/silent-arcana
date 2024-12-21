// src/test/app.test.js
import { describe, it, expect, jest } from '@jest/globals';

// (1) ESM向けのモジュールモック
// createDetectorをダミーにして外部ネットワークモデル呼び出しを回避
jest.unstable_mockModule('@tensorflow-models/hand-pose-detection', () => ({
  createDetector: jest.fn(async () => ({
    estimateHands: jest.fn(async () => []),
  })),
  SupportedModels: {
    MediaPipeHands: 'MediaPipeHands',
  },
}));

// (2) モック後に「本物の」モジュールをESM import
const { createDetector } = await import('@tensorflow-models/hand-pose-detection');

// (3) テスト対象コードをimport
const { loadModel } = await import('../app.js');

//
// loadModel() のテスト (createDetectorのモックが効いているか確認)
//
describe('loadModel function', () => {
  it('should be defined', () => {
    expect(loadModel).toBeDefined();
  });

  it('モックされたcreateDetectorを使ってエラーなく呼べる', async () => {
    await expect(loadModel()).resolves.not.toThrow();
    expect(createDetector).toHaveBeenCalledTimes(1);
  });
});
