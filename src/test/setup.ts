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

// getUserMediaのモック
if (!global.navigator) {
  global.navigator = {};
}
if (!global.navigator.mediaDevices) {
  global.navigator.mediaDevices = {};
}
global.navigator.mediaDevices.getUserMedia = vi.fn(); 