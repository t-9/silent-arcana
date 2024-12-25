// src/test/cameraService.test.ts
import { startCamera } from '../cameraService';
import { jest } from '@jest/globals';

type GetUserMediaFn = (
  constraints: MediaStreamConstraints,
) => Promise<MediaStream>;
const mockGetUserMedia = jest.fn();
const typedMock = mockGetUserMedia as jest.MockedFunction<GetUserMediaFn>;
typedMock.mockResolvedValue({} as MediaStream);

describe('cameraService', () => {
  /*
  it('startCamera sets srcObject and clears loading on success', async () => {
    // ★1) モックのvideoElを用意
    const mockVideoEl = {
      srcObject: null,
      onloadedmetadata: () => { },
    } as unknown as HTMLVideoElement;

    // ★2) モックの setLoading
    const mockSetLoading = jest.fn();

    // ★3) getUserMediaを成功モックに
    typedMock.mockResolvedValue({} as MediaStream);
    (global.navigator as any).mediaDevices = {
      getUserMedia: typedMock,
    };

    // ★4) startCamera呼び出し
    // ただし"即await"せずに一旦変数に受け取る
    const startCameraPromise = startCamera(mockVideoEl, mockSetLoading);

    // ★5) startCamera内部で "onloadedmetadata = () => {resolve()}" がセットされるはず
    // それを手動で発火:
    mockVideoEl.onloadedmetadata && mockVideoEl.onloadedmetadata(new Event('loadedmetadata'));
    expect(typeof mockVideoEl.onloadedmetadata).toBe('function');

    // ★6) ここでresolve()が呼ばれるので、await で完了
    await startCameraPromise;

    // ★7) 検証
    expect(mockSetLoading).toHaveBeenCalledWith('カメラを起動しています...');
    expect(mockVideoEl.srcObject).not.toBeNull();
    expect(mockSetLoading).toHaveBeenLastCalledWith('');
  });
  */

  it('startCamera shows error if getUserMedia throws', async () => {
    const mockVideoEl = {
      srcObject: null,
      onloadedmetadata: jest.fn(),
    } as unknown as HTMLVideoElement;
    const mockSetLoading = jest.fn();

    typedMock.mockRejectedValue(new Error('User denied camera access'));

    if (!navigator.mediaDevices) {
      // definePropertyでプロパティを新規作成
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {},
        writable: true,
        configurable: true,
      });
    }

    // 5) 既存の mediaDevices を上書き可能にして、getUserMedia を差し替え
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: mockGetUserMedia,
      writable: true,
      configurable: true,
    });

    await startCamera(mockVideoEl, mockSetLoading);

    expect(mockSetLoading).toHaveBeenCalledWith('カメラを起動しています...');
    expect(mockSetLoading).toHaveBeenLastCalledWith(
      'カメラの起動に失敗しました',
    );
  });
});
