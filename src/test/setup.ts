import { vi } from 'vitest';

// localStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// MediaStreamのモック
class MediaStreamMock {
  getTracks() {
    return [
      {
        stop: () => {},
      },
    ];
  }
}
Object.defineProperty(window, 'MediaStream', {
  value: MediaStreamMock,
});

// MediaDevicesのモック
const createMediaDevicesMock = () => {
  const mediaDevices = {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn().mockResolvedValue([]),
    getDisplayMedia: vi.fn(),
    getSupportedConstraints: vi.fn().mockReturnValue({}),
    ondevicechange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  return mediaDevices;
};

// PluginArrayのモック
class PluginArrayMock {
  length = 0;
  /* eslint-disable @typescript-eslint/no-unused-vars */
  item(_index: number) {
    return null;
  }
  namedItem(_name: string) {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  /* istanbul ignore next */
  refresh(): void {
    // テスト環境ではプラグインの更新は不要
    // このメソッドはPluginArrayインターフェースを満たすために存在
  }
  [Symbol.iterator]() {
    return [][Symbol.iterator]();
  }
}

// MimeTypeArrayのモック
class MimeTypeArrayMock {
  length = 0;
  /* eslint-disable @typescript-eslint/no-unused-vars */
  item(_index: number) {
    return null;
  }
  namedItem(_name: string) {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
  [Symbol.iterator]() {
    return [][Symbol.iterator]();
  }
}

// getUserMediaのモック
if (!global.navigator) {
  global.navigator = {
    mediaDevices: createMediaDevicesMock(),
    clipboard: {} as Clipboard,
    credentials: {} as CredentialsContainer,
    geolocation: {} as Geolocation,
    doNotTrack: null,
    language: 'ja',
    languages: ['ja'],
    onLine: true,
    userAgent: 'test',
    vendor: 'test',
    platform: 'test',
    plugins: new PluginArrayMock(),
    mimeTypes: new MimeTypeArrayMock(),
    hardwareConcurrency: 4,
    maxTouchPoints: 0,
    serviceWorker: {} as ServiceWorkerContainer,
    cookieEnabled: true,
    webdriver: false,
    pdfViewerEnabled: false,
    connection: null,
    permissions: {} as Permissions,
    mediaCapabilities: {} as MediaCapabilities,
    mediaSession: {} as MediaSession,
    userActivation: {} as UserActivation,
    wakeLock: {} as WakeLock,
    // その他のNavigatorプロパティも必要に応じて追加

    // テスト環境では使用しないメソッドをスタブ化
    canShare: () => false,
    getGamepads: () => [],
    requestMIDIAccess: () => Promise.reject(new Error('Not implemented')),
    requestMediaKeySystemAccess: () =>
      Promise.reject(new Error('Not implemented')),
    share: () => Promise.reject(new Error('Not implemented')),
    vibrate: () => false,
  } as unknown as Navigator;
} else if (!global.navigator.mediaDevices) {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: createMediaDevicesMock(),
    configurable: true,
  });
}

// グローバルなモックの設定
vi.mock('@tensorflow/tfjs', () => ({
  setBackend: vi.fn().mockResolvedValue(undefined),
  ready: vi.fn().mockResolvedValue(undefined),
}));

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

// エラーハンドリングの設定
vi.stubGlobal('onerror', (event: Event | string) => {
  console.error('Caught unhandled error:', event);
  return true;
});

vi.stubGlobal('onunhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('Caught unhandled rejection:', event.reason);
  event.preventDefault();
  return true;
});
