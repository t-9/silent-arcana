// src/test/app.test.ts
import { init } from '../app'; // startCameraは使用しないのでコメントアウト
import { createHandDetector, setCreateDetector } from '../detectionModule';
import { setGetUserMedia } from '../cameraModule';
import { HandDetector, Hand } from '@tensorflow-models/hand-pose-detection';
import { jest } from "@jest/globals";

// モックのHandDetector
class MockHandDetector implements HandDetector {
  estimateHands(): Promise<Hand[]> {
    // Handインターフェースに合わせる
    return Promise.resolve([
      {
        keypoints: [{ name: 'thumb', x: 0.5, y: 0.5 }],
        handedness: 'Left', // または 'Right'
        score: 0.9, // 適当なスコアを設定
      },
    ]);
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
  public onaddtrack:
    | ((this: MediaStream, ev: MediaStreamTrackEvent) => void)
    | null = null;
  public onremovetrack:
    | ((this: MediaStream, ev: MediaStreamTrackEvent) => void)
    | null = null;
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
    this.tracks = this.tracks.filter((t) => t !== track);
  }

  clone(): MockMediaStream {
    return new MockMediaStream(this.tracks);
  }

  getAudioTracks(): MockMediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === 'audio');
  }

  getTrackById(trackId: string): MockMediaStreamTrack | null {
    return this.tracks.find((track) => track.id === trackId) || null;
  }

  getVideoTracks(): MockMediaStreamTrack[] {
    return this.tracks.filter((track) => track.kind === 'video');
  }

  get addtrack():
    | ((this: MediaStream, ev: MediaStreamTrackEvent) => void)
    | null {
    return this.onaddtrack;
  }

  set addtrack(
    listener: ((this: MediaStream, ev: MediaStreamTrackEvent) => void) | null,
  ) {
    this.onaddtrack = listener;
  }

  get removetrack():
    | ((this: MediaStream, ev: MediaStreamTrackEvent) => void)
    | null {
    return this.onremovetrack;
  }

  set removetrack(
    listener: ((this: MediaStream, ev: MediaStreamTrackEvent) => void) | null,
  ) {
    this.onremovetrack = listener;
  }

  // EventTargetのメソッドを追加
  addEventListener(
    _type: string,
    _listener: EventListenerOrEventListenerObject,
    _options?: boolean | AddEventListenerOptions,
  ): void {
    // モック実装
  }

  removeEventListener(
    _type: string,
    _listener: EventListenerOrEventListenerObject,
    _options?: boolean | EventListenerOptions,
  ): void {
    // モック実装
  }

  dispatchEvent(_event: Event): boolean {
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
        console.log('Mock onloadedmetadata fired');
      }),
      play: jest.fn(),
      addEventListener: jest.fn(),
    } as unknown as HTMLVideoElement;

    mockLoadingElement = {
      textContent: '',
    } as unknown as HTMLElement;

    global.MediaStream = MockMediaStream as unknown as typeof MediaStream; // MediaStreamをモックし、型チェックを回避

    if (!global.navigator) {
      global.navigator = {} as unknown as Navigator;
    }

    if (!global.navigator.mediaDevices) {
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {},
        writable: true,
        configurable: true,
      });
    }

    // ここでvideoElが正しく設定されることを保証
    document.getElementById = jest.fn((id: string) => {
      switch (id) {
        case 'video':
          return mockVideoElement;
        case 'loading':
          return mockLoadingElement;
        case 'start-btn':
          return { addEventListener: jest.fn() } as unknown as HTMLElement;
        case 'message':
          return { textContent: '' } as unknown as HTMLElement;
        default:
          return null;
      }
    });

    setGetUserMedia(async () => {
      // 実際のストリームを返す必要がなければ空のオブジェクトでもOK
      return new MockMediaStream() as unknown as MediaStream;
    });

    // モックの createDetector をセット
    setCreateDetector(mockCreateDetector);

    // init関数を実行して、videoEl を初期化
    init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // 元のcreateDetectorに戻す
    setCreateDetector(createHandDetector);
  });

  test('startCamera sets up video stream', () => {
    // 現在 mockVideoElement に onloadedmetadata: jest.fn() が入っている
    // それを差し替えて、実際にイベントが呼ばれたか確かめる
    const originalOnloadedmetadata = mockVideoElement.onloadedmetadata;
    mockVideoElement.onloadedmetadata = function (
      this: GlobalEventHandlers,
      _event: Event,
    ) {
      if (originalOnloadedmetadata) {
        originalOnloadedmetadata.call(this, _event);
      }
    };

    expect(mockLoadingElement.textContent).toBe('');
  });

  test('init initializes the application', async () => {
    const mockStartBtn = { addEventListener: jest.fn() };
    document.getElementById = jest.fn((id: string) => {
      if (id === 'start-btn') return mockStartBtn as unknown as HTMLElement;
      return mockVideoElement;
    });

    await init();
    expect(mockCreateDetector).toHaveBeenCalled();
    expect(mockStartBtn.addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
    );
  });
});
