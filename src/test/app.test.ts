// src/test/app.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { HandDetector } from '@tensorflow-models/hand-pose-detection';
import { init } from '../app';
import {
  loadModel,
  startDetection,
  detectLoop,
} from '../detection/modelService';
import { getElement } from '../domUtils';
import { setupKeyboardEvents } from '../eventHandlers';
import { startCamera } from '../camera/cameraService';
import { setupGameUI } from '../gameHandlers';
import { loadGestureData } from '../gestureService';
import { preloadSounds } from '../services/soundService';
import * as tf from '@tensorflow/tfjs';
import type { Gesture } from '../types';
import { setLoadingText } from '../uiUtils';
// WebGLのモック
const mockWebGLContext = {
  getParameter: vi.fn(),
  createBuffer: vi.fn(),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  clear: vi.fn(),
  useProgram: vi.fn(),
  getExtension: vi.fn(),
  isContextLost: vi.fn().mockReturnValue(false),
  getShaderPrecisionFormat: vi.fn().mockReturnValue({
    precision: 23,
    rangeMin: 127,
    rangeMax: 127,
  }),
  createShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn().mockReturnValue(true),
  createProgram: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn().mockReturnValue(true),
  deleteShader: vi.fn(),
  getAttribLocation: vi.fn(),
  getUniformLocation: vi.fn(),
  viewport: vi.fn(),
  clearColor: vi.fn(),
  cullFace: vi.fn(),
  blendFunc: vi.fn(),
  blendEquation: vi.fn(),
  depthFunc: vi.fn(),
  depthMask: vi.fn(),
  depthRange: vi.fn(),
  activeTexture: vi.fn(),
  pixelStorei: vi.fn(),
  vertexAttribPointer: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  disableVertexAttribArray: vi.fn(),
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  ARRAY_BUFFER: 34962,
  ELEMENT_ARRAY_BUFFER: 34963,
  FLOAT: 5126,
  TRIANGLES: 4,
  DEPTH_TEST: 2929,
  CULL_FACE: 2884,
  BLEND: 3042,
  ONE: 1,
  ONE_MINUS_SRC_ALPHA: 771,
  TEXTURE_2D: 3553,
  TEXTURE0: 33984,
  UNPACK_FLIP_Y_WEBGL: 37440,
  UNPACK_PREMULTIPLY_ALPHA_WEBGL: 37441,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  canvas: document.createElement('canvas'),
  drawingBufferWidth: 1920,
  drawingBufferHeight: 1080,
  getContextAttributes: vi.fn().mockReturnValue({
    alpha: true,
    antialias: true,
    depth: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'default',
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    stencil: true,
    desynchronized: false,
  }),
} as unknown as WebGLRenderingContext;

// Canvasのモック
const mockGetContext = vi.fn().mockImplementation((contextId: string) => {
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return mockWebGLContext;
  }
  return null;
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext,
  writable: true,
});

// モックの設定
vi.mock('@tensorflow/tfjs', async () => {
  return {
    setBackend: vi.fn().mockResolvedValue(undefined),
    ready: vi.fn().mockResolvedValue(undefined),
  };
});
vi.mock('../detection/modelService');
vi.mock('../domUtils', () => ({
  getElement: vi.fn(),
  setLoadingText: vi.fn(),
}));
vi.mock('../eventHandlers');
vi.mock('../uiUtils');
vi.mock('../camera/cameraService');
vi.mock('../gameHandlers');
vi.mock('../gestureService');
vi.mock('../services/soundService');

describe('app', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    document.body.innerHTML = `
      <video id="video"></video>
      <div id="loading"></div>
      <div id="message"></div>
      <div id="timer"></div>
      <div id="score"></div>
      <div id="dialog-overlay"></div>
    `;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should initialize app with all required components', async () => {
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');
    const mockStartGameBtn = document.createElement('button');
    const mockScoreDisplay = document.createElement('div');
    const mockGestureDisplay = document.createElement('div');
    const mockTimerDisplay = document.createElement('div');

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo)
      .mockReturnValueOnce(mockLoading)
      .mockReturnValueOnce(mockMessage)
      .mockReturnValueOnce(mockStartGameBtn)
      .mockReturnValueOnce(mockScoreDisplay)
      .mockReturnValueOnce(mockGestureDisplay)
      .mockReturnValueOnce(mockTimerDisplay);

    const mockHandDetector = {
      estimateHands: vi.fn(),
    } as unknown as HandDetector;

    vi.mocked(loadModel).mockResolvedValue(mockHandDetector);
    vi.mocked(loadGestureData).mockResolvedValue([
      { name: 'テスト手話1', landmarks: [[0, 0, 0]] },
      { name: 'テスト手話2', landmarks: [[1, 1, 1]] },
    ]);
    vi.mocked(startCamera).mockResolvedValue(undefined);
    vi.mocked(preloadSounds).mockResolvedValue(undefined);

    await init();

    expect(getElement).toHaveBeenCalledWith('video');
    expect(getElement).toHaveBeenCalledWith('loading');
    expect(getElement).toHaveBeenCalledWith('message');
    expect(getElement).toHaveBeenCalledWith('start-game-btn');
    expect(getElement).toHaveBeenCalledWith('score-display');
    expect(getElement).toHaveBeenCalledWith('gesture-display');
    expect(getElement).toHaveBeenCalledWith('timer-display');
  });

  it('should handle missing DOM elements', async () => {
    // 必要なDOM要素をクリア
    document.body.innerHTML = '';

    // getElementのモックを設定
    vi.mocked(getElement)
      .mockReturnValueOnce(null) // video
      .mockReturnValueOnce(document.createElement('div')) // loading
      .mockReturnValueOnce(document.createElement('div')); // message

    // エラーをキャッチして検証
    try {
      await init();
      // initが成功した場合はテストを失敗させる
      expect(true).toBe(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toBe('DOM要素が見つからない');
        expect(consoleSpy).toHaveBeenCalledWith('DOM要素が見つからない');
      } else {
        throw error;
      }
    }
  });

  it('should handle missing game UI elements', async () => {
    // video, loading, message は正しく返すが…
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo) // video
      .mockReturnValueOnce(mockLoading) // loading
      .mockReturnValueOnce(mockMessage) // message
      // ここまではOK, だが次でゲームUI要素がnullを返す
      .mockReturnValueOnce(null); // start-game-btnがnullになる、と仮定

    await expect(init()).rejects.toThrow('ゲームUI要素が見つかりません');
    expect(console.error).toHaveBeenCalledWith('ゲームUI要素が見つかりません');
  });

  it('should call setLoadingText for model loading (line 65)', async () => {
    // DOM要素準備
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');
    const mockStartGameBtn = document.createElement('button');
    const mockScoreDisplay = document.createElement('div');
    const mockGestureDisplay = document.createElement('div');
    const mockTimerDisplay = document.createElement('div');

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo)
      .mockReturnValueOnce(mockLoading)
      .mockReturnValueOnce(mockMessage)
      .mockReturnValueOnce(mockStartGameBtn)
      .mockReturnValueOnce(mockScoreDisplay)
      .mockReturnValueOnce(mockGestureDisplay)
      .mockReturnValueOnce(mockTimerDisplay);

    vi.mocked(loadModel).mockImplementation(async (cb) => {
      // コールバックを明示的に呼ぶ: これで line65 の setLoadingText が走る
      cb('モデル読み込み中…');
      // HandDetector の代わりに必要最低限のダミーオブジェクトを作る
      const mockHandDetector: HandDetector = {
        // 例: estimateHands など最低限必要なメソッドを定義
        estimateHands: vi.fn(),
      } as unknown as HandDetector;

      return mockHandDetector;
    });

    // 他のモック
    vi.mocked(loadGestureData).mockResolvedValue([
      { name: 'gesture', landmarks: [[0, 0]] },
    ]);
    vi.mocked(startCamera).mockResolvedValue(undefined);

    await init();

    // domUtils から import している setLoadingText が mockされているはず
    expect(setLoadingText).toHaveBeenCalledWith(
      mockLoading,
      'モデル読み込み中…',
    );
  });

  it('should call setLoadingText for camera start (line 81)', async () => {
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');
    const mockStartGameBtn = document.createElement('button');
    const mockScoreDisplay = document.createElement('div');
    const mockGestureDisplay = document.createElement('div');
    const mockTimerDisplay = document.createElement('div');

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo)
      .mockReturnValueOnce(mockLoading)
      .mockReturnValueOnce(mockMessage)
      .mockReturnValueOnce(mockStartGameBtn)
      .mockReturnValueOnce(mockScoreDisplay)
      .mockReturnValueOnce(mockGestureDisplay)
      .mockReturnValueOnce(mockTimerDisplay);

    // startCameraをモックし、コールバックを手動で呼ぶ
    vi.mocked(startCamera).mockImplementation(async (_video, cb) => {
      cb('カメラ起動中…');
      return;
    });

    // 他モック
    const mockHandDetector: HandDetector = {
      estimateHands: vi.fn(),
      // 必要なら他のプロパティやメソッドを追加
    } as unknown as HandDetector;

    vi.mocked(loadModel).mockResolvedValue(mockHandDetector);
    vi.mocked(loadGestureData).mockResolvedValue([
      { name: 'gesture', landmarks: [[0, 0]] },
    ]);

    await init();

    expect(setLoadingText).toHaveBeenCalledWith(mockLoading, 'カメラ起動中…');
  });

  it('should handle empty gesture data (line 71-77)', async () => {
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');
    const mockStartGameBtn = document.createElement('button');
    const mockScoreDisplay = document.createElement('div');
    const mockGestureDisplay = document.createElement('div');
    const mockTimerDisplay = document.createElement('div');

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo)
      .mockReturnValueOnce(mockLoading)
      .mockReturnValueOnce(mockMessage)
      .mockReturnValueOnce(mockStartGameBtn)
      .mockReturnValueOnce(mockScoreDisplay)
      .mockReturnValueOnce(mockGestureDisplay)
      .mockReturnValueOnce(mockTimerDisplay);

    // modelとcamera系は成功すると仮定
    // ここが修正ポイント：型を指定
    vi.mocked(loadModel).mockResolvedValue({
      estimateHands: vi.fn(),
    } as unknown as HandDetector);

    vi.mocked(startCamera).mockResolvedValue(undefined);

    // "空配列" を返す -> 行71-77 が通る
    vi.mocked(loadGestureData).mockResolvedValue([]);

    await expect(init()).rejects.toThrow('手話データの読み込みに失敗しました');

    // console.error が呼ばれたかもチェック
    expect(console.error).toHaveBeenCalledWith(
      '手話データの読み込みに失敗しました',
    );
  });

  it('should handle gesture data loading failure', async () => {
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');
    const mockStartGameBtn = document.createElement('button');
    const mockScoreDisplay = document.createElement('div');
    const mockGestureDisplay = document.createElement('div');
    const mockTimerDisplay = document.createElement('div');

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo)
      .mockReturnValueOnce(mockLoading)
      .mockReturnValueOnce(mockMessage)
      .mockReturnValueOnce(mockStartGameBtn)
      .mockReturnValueOnce(mockScoreDisplay)
      .mockReturnValueOnce(mockGestureDisplay)
      .mockReturnValueOnce(mockTimerDisplay);

    const mockHandDetector = {
      estimateHands: vi.fn(),
    } as unknown as HandDetector;

    vi.mocked(loadModel).mockResolvedValue(mockHandDetector);
    vi.mocked(loadGestureData).mockRejectedValue(
      new Error('ジェスチャーデータの読み込みに失敗'),
    );

    const promise = init();
    await expect(promise).rejects.toThrow('ジェスチャーデータの読み込みに失敗');
    expect(consoleSpy).toHaveBeenCalledWith(
      '初期化に失敗しました:',
      new Error('ジェスチャーデータの読み込みに失敗'),
    );
  });

  it('should handle initialization error', async () => {
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');
    const mockStartGameBtn = document.createElement('button');
    const mockScoreDisplay = document.createElement('div');
    const mockGestureDisplay = document.createElement('div');
    const mockTimerDisplay = document.createElement('div');

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo)
      .mockReturnValueOnce(mockLoading)
      .mockReturnValueOnce(mockMessage)
      .mockReturnValueOnce(mockStartGameBtn)
      .mockReturnValueOnce(mockScoreDisplay)
      .mockReturnValueOnce(mockGestureDisplay)
      .mockReturnValueOnce(mockTimerDisplay);

    vi.mocked(loadModel).mockRejectedValue(new Error('モデルの読み込みに失敗'));

    await expect(init()).rejects.toThrow('モデルの読み込みに失敗');
    expect(consoleSpy).toHaveBeenCalledWith(
      '初期化に失敗しました:',
      new Error('モデルの読み込みに失敗'),
    );
  });

  it('should initialize TensorFlow.js correctly', async () => {
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');
    const mockStartGameBtn = document.createElement('button');
    const mockScoreDisplay = document.createElement('div');
    const mockGestureDisplay = document.createElement('div');
    const mockTimerDisplay = document.createElement('div');

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo)
      .mockReturnValueOnce(mockLoading)
      .mockReturnValueOnce(mockMessage)
      .mockReturnValueOnce(mockStartGameBtn)
      .mockReturnValueOnce(mockScoreDisplay)
      .mockReturnValueOnce(mockGestureDisplay)
      .mockReturnValueOnce(mockTimerDisplay);

    const mockHandDetector = {
      estimateHands: vi.fn(),
    } as unknown as HandDetector;

    vi.mocked(loadModel).mockResolvedValue(mockHandDetector);
    vi.mocked(loadGestureData).mockResolvedValue([
      { name: 'テスト手話1', landmarks: [[0, 0, 0]] },
      { name: 'テスト手話2', landmarks: [[1, 1, 1]] },
    ]);
    vi.mocked(startCamera).mockResolvedValue(undefined);
    vi.mocked(preloadSounds).mockResolvedValue(undefined);

    await init();

    expect(tf.setBackend).toHaveBeenCalledWith('webgl');
    expect(tf.ready).toHaveBeenCalled();
  });

  it('should enable start button after camera initialization', async () => {
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');
    const mockStartGameBtn = document.createElement('button');
    const mockScoreDisplay = document.createElement('div');
    const mockGestureDisplay = document.createElement('div');
    const mockTimerDisplay = document.createElement('div');

    mockStartGameBtn.disabled = true;

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo)
      .mockReturnValueOnce(mockLoading)
      .mockReturnValueOnce(mockMessage)
      .mockReturnValueOnce(mockStartGameBtn)
      .mockReturnValueOnce(mockScoreDisplay)
      .mockReturnValueOnce(mockGestureDisplay)
      .mockReturnValueOnce(mockTimerDisplay);

    const mockHandDetector = {
      estimateHands: vi.fn(),
    } as unknown as HandDetector;

    vi.mocked(loadModel).mockResolvedValue(mockHandDetector);
    vi.mocked(loadGestureData).mockResolvedValue([
      { name: 'テスト手話1', landmarks: [[0, 0, 0]] },
      { name: 'テスト手話2', landmarks: [[1, 1, 1]] },
    ]);
    vi.mocked(startCamera).mockResolvedValue(undefined);

    await init();

    expect(mockStartGameBtn.disabled).toBe(false);
    expect(startDetection).toHaveBeenCalled();
    expect(detectLoop).toHaveBeenCalledWith(mockVideo, mockMessage);
  });

  it('should setup game UI correctly', async () => {
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');
    const mockStartGameBtn = document.createElement('button');
    const mockScoreDisplay = document.createElement('div');
    const mockGestureDisplay = document.createElement('div');
    const mockTimerDisplay = document.createElement('div');

    const mockGestures: Gesture[] = [
      { name: 'テスト手話1', landmarks: [[0, 0, 0]] },
      { name: 'テスト手話2', landmarks: [[1, 1, 1]] },
    ];

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo)
      .mockReturnValueOnce(mockLoading)
      .mockReturnValueOnce(mockMessage)
      .mockReturnValueOnce(mockStartGameBtn)
      .mockReturnValueOnce(mockScoreDisplay)
      .mockReturnValueOnce(mockGestureDisplay)
      .mockReturnValueOnce(mockTimerDisplay);

    const mockHandDetector = {
      estimateHands: vi.fn(),
    } as unknown as HandDetector;

    vi.mocked(loadModel).mockResolvedValue(mockHandDetector);
    vi.mocked(loadGestureData).mockResolvedValue(mockGestures);
    vi.mocked(startCamera).mockResolvedValue(undefined);

    await init();

    expect(setupGameUI).toHaveBeenCalledWith(
      mockStartGameBtn,
      mockScoreDisplay,
      mockGestureDisplay,
      mockTimerDisplay,
      mockGestures,
    );
  });

  it('should setup keyboard events', async () => {
    const mockVideo = document.createElement('video');
    const mockLoading = document.createElement('div');
    const mockMessage = document.createElement('div');
    const mockStartGameBtn = document.createElement('button');
    const mockScoreDisplay = document.createElement('div');
    const mockGestureDisplay = document.createElement('div');
    const mockTimerDisplay = document.createElement('div');

    vi.mocked(getElement)
      .mockReturnValueOnce(mockVideo)
      .mockReturnValueOnce(mockLoading)
      .mockReturnValueOnce(mockMessage)
      .mockReturnValueOnce(mockStartGameBtn)
      .mockReturnValueOnce(mockScoreDisplay)
      .mockReturnValueOnce(mockGestureDisplay)
      .mockReturnValueOnce(mockTimerDisplay);

    const mockHandDetector = {
      estimateHands: vi.fn(),
    } as unknown as HandDetector;

    vi.mocked(loadModel).mockResolvedValue(mockHandDetector);
    vi.mocked(loadGestureData).mockResolvedValue([
      { name: 'テスト手話1', landmarks: [[0, 0, 0]] },
      { name: 'テスト手話2', landmarks: [[1, 1, 1]] },
    ]);
    vi.mocked(startCamera).mockResolvedValue(undefined);

    await init();

    expect(setupKeyboardEvents).toHaveBeenCalledWith(mockVideo);
  });
});
