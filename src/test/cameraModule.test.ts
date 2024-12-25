import { getGetUserMedia, setGetUserMedia } from '../cameraModule';
// ここが重要 (TSバージョンやJestバージョンによっては @jest/globals ではなく 'jest' からの場合も)
import { jest } from '@jest/globals';

type GetUserMediaType = (
  constraints: MediaStreamConstraints,
) => Promise<MediaStream>;

if (typeof global.navigator === 'undefined') {
  Object.defineProperty(global, 'navigator', {
    value: {},
    writable: true,
    configurable: true,
  });
}
if (typeof global.navigator.mediaDevices === 'undefined') {
  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {},
    writable: true,
    configurable: true,
  });
}

describe('cameraModule', () => {
  let originalGetUserMedia: typeof navigator.mediaDevices.getUserMedia;

  beforeAll(() => {
    originalGetUserMedia = navigator.mediaDevices.getUserMedia;
  });

  afterAll(() => {
    navigator.mediaDevices.getUserMedia = originalGetUserMedia;
  });

  afterEach(() => {
    // 本物の getUserMedia に戻す
    setGetUserMedia(async (constraints: MediaStreamConstraints) => {
      return navigator.mediaDevices.getUserMedia(constraints);
    });
  });

  test('デフォルト状態では本物の getUserMedia を呼ぶ', async () => {
    // モック関数を「(constraints) => Promise<MediaStream>」型として作る
    const mockNativeGetUserMedia: jest.MockedFunction<GetUserMediaType> =
      jest.fn();

    // 返却するダミーの MediaStream
    const fakeStream = { id: 'fakeStream' } as MediaStream;
    mockNativeGetUserMedia.mockResolvedValue(fakeStream);

    // グローバルに挿げ替え
    navigator.mediaDevices.getUserMedia = mockNativeGetUserMedia;

    // テスト対象
    const getUserMediaFn = getGetUserMedia();
    const result = await getUserMediaFn({ video: true });

    expect(mockNativeGetUserMedia).toHaveBeenCalledWith({ video: true });
    expect(result).toBe(fakeStream);
  });

  test('setGetUserMedia でモックに差し替えたらそれが呼ばれる', async () => {
    // (constraints) => Promise<MediaStream> な関数をモック化
    const mockGetUserMedia: jest.MockedFunction<GetUserMediaType> = jest.fn();
    const mockStream = { id: 'mock-stream' } as MediaStream;
    mockGetUserMedia.mockResolvedValue(mockStream);

    // cameraModule にモックをセット
    setGetUserMedia(mockGetUserMedia);

    // 取得して呼ぶ
    const getUserMediaFn = getGetUserMedia();
    const result = await getUserMediaFn({ video: false, audio: true });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: false,
      audio: true,
    });
    expect(result).toBe(mockStream);
  });

  test('モックした getUserMedia がエラーを投げる場合', async () => {
    const mockGetUserMediaError: jest.MockedFunction<GetUserMediaType> =
      jest.fn();
    // reject時は「Promise.reject」なので型的には OK
    mockGetUserMediaError.mockRejectedValue(new Error('Mock error'));

    setGetUserMedia(mockGetUserMediaError);

    const getUserMediaFn = getGetUserMedia();
    await expect(getUserMediaFn({ video: true })).rejects.toThrow('Mock error');
  });
});
