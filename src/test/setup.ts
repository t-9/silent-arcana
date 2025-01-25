import { vi } from 'vitest';

// localStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// MediaStreamのモック
class MediaStreamMock {
  getTracks() {
    return [{
      stop: () => { }
    }];
  }
}
Object.defineProperty(window, 'MediaStream', {
  value: MediaStreamMock
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
    dispatchEvent: vi.fn()
  };
  return mediaDevices;
};

// PluginArrayのモック
class PluginArrayMock {
  length = 0;
  item(_index: number) { return null; }
  namedItem(_name: string) { return null; }
  refresh() { }
  [Symbol.iterator]() { return [][Symbol.iterator](); }
}

// MimeTypeArrayのモック
class MimeTypeArrayMock {
  length = 0;
  item(_index: number) { return null; }
  namedItem(_name: string) { return null; }
  [Symbol.iterator]() { return [][Symbol.iterator](); }
}

// getUserMediaのモック
if (!global.navigator) {
  (global as typeof globalThis).navigator = {
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
  } as unknown as Navigator;
} else if (!global.navigator.mediaDevices) {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: createMediaDevicesMock(),
    configurable: true
  });
}