// src/test/app.test.ts
import { loadModel, startCamera, init } from '../app'; // videoElはインポートしない
import { createHandDetector, setCreateDetector } from '../detectionModule';
import { HandDetector } from '@tensorflow-models/hand-pose-detection';

// テスト専用のvideoElを定義
let videoEl: HTMLVideoElement | null = null;

// モックのHandDetector
class MockHandDetector implements HandDetector {
  estimateHands(): Promise<any> {
    return Promise.resolve([{ keypoints: [{ name: 'thumb', x: 0.5, y: 0.5 }] }]);
  }

  dispose(): void {
    // mock implementation
  }

  reset(): void {
    // mock implementation
  }
}

// モックのcreateDetector
const mockCreateDetector = jest.fn(async () => {
  return new MockHandDetector();
});

// MediaStreamTrackのモックインターフェース
interface MockMediaStreamTrack {
  id: string;
  kind: 'audio' | 'video';
  // その他の必要なプロパティをここに追加
}

// MediaStreamのモック
class MockMediaStream {
  public active = false;
  public id = 'mock-id';
  public onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;
  public onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null = null;
  private tracks: MockMediaStreamTrack[] = [];

  constructor(tracks: MockMediaStreamTrack[] = []) {
    this.tracks = tracks;
  }

  getTracks(): MockMediaStreamTrack[] {
    return this.tracks;
  }

  addTrack(track: MockMediaStreamTrack): void {
    this.tracks.push(track);
  }

  removeTrack(track: MockMediaStreamTrack): void {
    this.tracks = this.tracks.filter(t => t !== track);
  }

  clone(): MockMediaStream {
    return new MockMediaStream(this.tracks);
  }

  getAudioTracks(): MockMediaStreamTrack[] {
    return this.tracks.filter(track => track.kind === 'audio');
  }

  getTrackById(trackId: string): MockMediaStreamTrack | null {
    return this.tracks.find(track => track.id === trackId) || null;
  }

  getVideoTracks(): MockMediaStreamTrack[] {
    return this.tracks.filter(track => track.kind === 'video');
  }

  get addtrack(): ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null {
    return this.onaddtrack;
  }

  set addtrack(listener: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null) {
    this.onaddtrack = listener;
  }

  get removetrack(): ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null {
    return this.onremovetrack;
  }

  set removetrack(listener: ((this: MediaStream, ev: MediaStreamTrackEvent) => any) | null) {
    this.onremovetrack = listener;
  }

  // EventTargetのメソッドを追加
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
    // モック実装
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
    // モック実装
  }

  dispatchEvent(event: Event): boolean {
    // モック実装
    return true;
  }
}

describe('app.ts', () => {
  let mockVideoElement: HTMLVideoElement;
  let mockLoadingElement: HTMLElement;

  beforeEach(() => {
    // DOM要素のモック
    mockVideoElement = {
      srcObject: null,
      onloadedmetadata: jest.fn(() => {
        console.log("Mock onloadedmetadata fired");
      }),
      play: jest.fn(),
      addEventListener: jest.fn(),
    } as unknown as HTMLVideoElement;

    mockLoadingElement = {
      textContent: '',
    } as unknown as HTMLElement;

    global.MediaStream = MockMediaStream as any; // MediaStreamをモックし、型チェックを回避

    if (!global.navigator) {
      global.navigator = {} as any;
    }

    if (!global.navigator.mediaDevices) {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {},
        writable: true,
        configurable: true
      });
    }

    // getUserMedia をモックして、カメラストリームをシミュレート
    global.navigator.mediaDevices.getUserMedia = jest.fn().mockImplementation(() => {
      return Promise.resolve(new global.MediaStream());
    });

    // ここでvideoElが正しく設定されることを保証
    document.getElementById = jest.fn((id: string) => {
      switch (id) {
        case 'video':
          videoEl = mockVideoElement; // テスト専用のvideoElを設定
          return mockVideoElement;
        case 'loading': return mockLoadingElement;
        case 'start-btn': return { addEventListener: jest.fn() } as unknown as HTMLElement;
        case 'message': return { textContent: '' } as unknown as HTMLElement;
        default: return null;
      }
    });

    // モックのcreateDetectorをセット
    setCreateDetector(mockCreateDetector);

    // init関数を実行して、videoElを初期化
    init(); // この行を追加
  });

  afterEach(() => {
    jest.clearAllMocks();
    // 元のcreateDetectorに戻す
    setCreateDetector(createHandDetector);
    videoEl = null; // テスト終了時にリセット
  });

  test('loadModel sets loading text and calls createHandDetector', async () => {
    await loadModel();
    expect(mockLoadingElement.textContent).toBe(''); // モデルの読み込みが完了したことを確認
    expect(mockCreateDetector).toHaveBeenCalled();
  });

  // TODO: カメラのテスト部分
  //
  //test('startCamera sets up video stream', async () => {
  //  let metadataEventFired = false;

  // onloadedmetadataのモックを設定
  //  const originalOnloadedmetadata = mockVideoElement.onloadedmetadata;
  // mockVideoElement.onloadedmetadata = function (this: GlobalEventHandlers, event: Event) {
  // metadataEventFired = true;
  // if (originalOnloadedmetadata) {
  //  originalOnloadedmetadata.call(this, event); // 正しいthisコンテキストで呼び出す
  // }
  // };

  //await startCamera();

  // onloadedmetadataイベントを強制的に発火させる
  //if (mockVideoElement.onloadedmetadata) {
  //  mockVideoElement.onloadedmetadata.call(mockVideoElement, { type: 'loadedmetadata' } as Event);
  //}

  // 即座に確認
  //  expect(metadataEventFired).toBe(true);

  //  expect(mockVideoElement.srcObject).not.toBeNull();
  // expect(mockVideoElement.srcObject).toBeInstanceOf(global.MediaStream);
  //expect(mockLoadingElement.textContent).toBe('');
  //}, 1000);

  test('init initializes the application', async () => {
    const mockStartBtn = { addEventListener: jest.fn() };
    document.getElementById = jest.fn((id: string) => {
      if (id === 'start-btn') return mockStartBtn as unknown as HTMLElement;
      return mockVideoElement;
    });

    await init();
    expect(mockCreateDetector).toHaveBeenCalled();
    expect(mockStartBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
  });
});