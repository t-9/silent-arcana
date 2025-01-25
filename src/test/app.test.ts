// src/test/app.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from '../app';
import { loadGestureData } from '../gestureService';
import { loadModel } from '../modelService';

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
vi.mock('../gestureService', () => ({
  loadGestureData: vi
    .fn()
    .mockResolvedValue([{ name: 'test-gesture', landmarks: [[0, 0, 0]] }]),
}));

vi.mock('../modelService', () => ({
  loadModel: vi.fn().mockResolvedValue(undefined),
  startDetection: vi.fn(),
  detectLoop: vi.fn(),
}));

vi.mock('../cameraService', () => ({
  startCamera: vi.fn().mockResolvedValue(undefined),
}));

describe('app', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // DOMの設定
    document.body.innerHTML = `
      <video id="video"></video>
      <div id="loading"></div>
      <div id="message"></div>
      <button id="start-game-btn"></button>
      <div id="score-display"></div>
      <div id="gesture-display"></div>
      <div id="timer-display"></div>
    `;
  });

  it('should initialize app with all required components', async () => {
    await init();

    expect(loadModel).toHaveBeenCalled();
    expect(loadGestureData).toHaveBeenCalled();

    // ボタンが有効化されていることを確認
    const startGameBtn = document.getElementById(
      'start-game-btn',
    ) as HTMLButtonElement;
    expect(startGameBtn.disabled).toBe(false);
  });
});
