// src/test/cameraModule.test.ts
import { getGetUserMedia, setGetUserMedia } from '../cameraModule';

/**
 * グローバル環境に navigator.mediaDevices.getUserMedia が存在しないかもしれないので、
 * 必要に応じて定義しておく
 */
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
  // テスト前に元の実装をバックアップ
  let originalGetUserMedia: typeof navigator.mediaDevices.getUserMedia;

  beforeAll(() => {
    originalGetUserMedia = global.navigator.mediaDevices.getUserMedia;
  });

  afterAll(() => {
    // テスト後に navigator.mediaDevices.getUserMedia を元に戻す
    global.navigator.mediaDevices.getUserMedia = originalGetUserMedia;
  });

  afterEach(() => {
    // setGetUserMedia に本物の関数を戻すなどのリセット処理が必要ならここで
    setGetUserMedia(async (constraints: MediaStreamConstraints) => {
      return navigator.mediaDevices.getUserMedia(constraints);
    });
  });

  test('デフォルト状態では本物の getUserMedia を呼び出す', async () => {
    // 本物の getUserMedia をモック化して呼び出しチェック
    const mockNativeGetUserMedia = jest
      .fn()
      .mockResolvedValue('realMediaStream');
    global.navigator.mediaDevices.getUserMedia = mockNativeGetUserMedia;

    // cameraModuleのgetGetUserMediaを呼ぶ
    const getUserMediaFn = getGetUserMedia();
    const result = await getUserMediaFn({ video: true });

    expect(mockNativeGetUserMedia).toHaveBeenCalledWith({ video: true });
    expect(result).toBe('realMediaStream');
  });

  test('setGetUserMedia でモックを設定した場合、そちらが呼ばれる', async () => {
    // まずモック関数を用意
    const mockGetUserMedia = jest
      .fn()
      .mockResolvedValue('mockMediaStream');

    // cameraModule にモックをセット
    setGetUserMedia(mockGetUserMedia);

    // getGetUserMedia() で取得すると、モックのはず
    const getUserMediaFn = getGetUserMedia();
    const result = await getUserMediaFn({ video: false, audio: true });

    expect(mockGetUserMedia).toHaveBeenCalledWith({ video: false, audio: true });
    expect(result).toBe('mockMediaStream');
  });

  test('setGetUserMedia に設定したモックがエラーを投げる場合、エラーを返す', async () => {
    const mockGetUserMediaError = jest
      .fn()
      .mockRejectedValue(new Error('Mock error'));

    setGetUserMedia(mockGetUserMediaError);

    const getUserMediaFn = getGetUserMedia();
    await expect(getUserMediaFn({ video: true })).rejects.toThrow('Mock error');
  });
});
