import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startCamera } from '../../camera/cameraService';
import * as cameraModule from '../../camera/cameraModule';

vi.mock('../../camera/cameraModule');

describe('cameraService', () => {
  const mockVideoEl = {
    srcObject: null,
    onloadedmetadata: null,
    onerror: null,
    play: vi.fn().mockResolvedValue(undefined),
    videoWidth: 1280,
    videoHeight: 720,
  } as unknown as HTMLVideoElement;
  const mockSetLoading = vi.fn();
  let mockGetUserMedia: ReturnType<typeof vi.fn>;
  let mockMessageEl: HTMLDivElement;

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetUserMedia = vi.fn();
    vi.spyOn(cameraModule, 'getGetUserMedia').mockImplementation(
      () => mockGetUserMedia,
    );
    vi.useFakeTimers();

    // メッセージ要素のモック
    mockMessageEl = document.createElement('div');
    mockMessageEl.id = 'message';
    document.body.appendChild(mockMessageEl);
  });

  afterEach(() => {
    vi.useRealTimers();
    // メッセージ要素のクリーンアップ
    const messageEl = document.getElementById('message');
    if (messageEl) {
      document.body.removeChild(messageEl);
    }
  });

  it('should start camera successfully', async () => {
    const mockStream = { id: 'test-stream' };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const startCameraPromise = startCamera(mockVideoEl, mockSetLoading);

    // メタデータロードイベントをシミュレート
    await vi.advanceTimersByTimeAsync(100);
    if (mockVideoEl.onloadedmetadata) {
      mockVideoEl.onloadedmetadata({} as Event);
    }

    await startCameraPromise;

    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockVideoEl.srcObject).toBe(mockStream);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('shows error if getUserMedia throws', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Camera access denied'));

    await expect(startCamera(mockVideoEl, mockSetLoading)).rejects.toThrow(
      'カメラ使用許可が必要です',
    );

    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it('should handle metadata load timeout', async () => {
    const mockStream = { id: 'test-stream' };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const promise = startCamera(mockVideoEl, mockSetLoading);

    // いったん未処理のままにしないために catch だけしておく
    promise.catch(() => {
      /* 何もしない */
    });

    await vi.advanceTimersByTimeAsync(6000);

    await expect(promise).rejects.toThrow('カメラの起動がタイムアウトしました');
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });
});
