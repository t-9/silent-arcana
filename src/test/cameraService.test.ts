// src/test/cameraService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startCamera } from '../cameraService';
import * as cameraModule from '../cameraModule';

vi.mock('../cameraModule');

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

  it.skipIf(process.env.CI)('should handle metadata load timeout', async () => {
    const mockVideo = document.createElement('video');
    const mockSetLoading = vi.fn();

    // メタデータロードイベントを発火しないようにする
    vi.useFakeTimers();

    try {
      const promise = startCamera(mockVideo, mockSetLoading);
      await vi.advanceTimersByTimeAsync(5000);
      await promise;
      // startCameraが成功した場合はテストを失敗させる
      expect(true).toBe(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toBe('カメラの起動がタイムアウトしました');
        expect(mockSetLoading).toHaveBeenCalledWith(false);
      } else {
        throw error;
      }
    } finally {
      vi.useRealTimers();
    }
  });
});
