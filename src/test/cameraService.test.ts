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

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetUserMedia = vi.fn();
    vi.spyOn(cameraModule, 'getGetUserMedia').mockImplementation(
      () => mockGetUserMedia,
    );
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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
});
