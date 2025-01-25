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
  let mockMessageEl: HTMLElement;

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
    expect(mockMessageEl.textContent).toBe('');
    expect(mockMessageEl.getAttribute('data-text')).toBe('');
  });

  it('shows error if getUserMedia throws', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Camera access denied'));

    await expect(startCamera(mockVideoEl, mockSetLoading)).rejects.toThrow(
      'カメラ使用許可が必要です',
    );

    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(mockSetLoading).toHaveBeenCalledWith(false);
    expect(mockMessageEl.textContent).toBe('カメラの起動に失敗しました');
    expect(mockMessageEl.getAttribute('data-text')).toBe(
      'カメラの起動に失敗しました',
    );
  });

  it('should handle video metadata load error', async () => {
    const mockStream = { id: 'test-stream' };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const startCameraPromise = startCamera(mockVideoEl, mockSetLoading);

    // エラーイベントをシミュレート
    await vi.advanceTimersByTimeAsync(100);
    if (mockVideoEl.onerror) {
      mockVideoEl.onerror({} as Event);
    }

    await expect(startCameraPromise).rejects.toThrow(
      'カメラ使用許可が必要です',
    );
    expect(mockMessageEl.textContent).toBe('カメラの起動に失敗しました');
  });

  it('should handle invalid video resolution', async () => {
    const mockStream = { id: 'test-stream' };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const invalidVideoEl = {
      ...mockVideoEl,
      videoWidth: 0,
      videoHeight: 0,
    } as unknown as HTMLVideoElement;

    const startCameraPromise = startCamera(invalidVideoEl, mockSetLoading);

    // メタデータロードイベントをシミュレート
    await vi.advanceTimersByTimeAsync(100);
    if (invalidVideoEl.onloadedmetadata) {
      invalidVideoEl.onloadedmetadata({} as Event);
    }

    await expect(startCameraPromise).rejects.toThrow(
      'カメラ使用許可が必要です',
    );
    expect(mockMessageEl.textContent).toBe('カメラの起動に失敗しました');
  });

  it('should handle metadata load timeout', async () => {
    const mockStream = { id: 'test-stream' };
    mockGetUserMedia.mockResolvedValue(mockStream);

    const startCameraPromise = startCamera(mockVideoEl, mockSetLoading);

    // タイムアウトをシミュレート
    await vi.advanceTimersByTimeAsync(5000);

    await expect(startCameraPromise).rejects.toThrow(
      'カメラの起動がタイムアウトしました',
    );
    expect(mockMessageEl.textContent).toBe('カメラの起動に失敗しました');
  });

  it('should handle missing message element', async () => {
    // メッセージ要素を削除
    document.body.innerHTML = '';

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
});
