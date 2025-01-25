import { describe, it, expect, vi } from 'vitest';
import { getGetUserMedia, setGetUserMedia } from '../cameraModule';

describe('cameraModule', () => {
  it('should use default constraints when none provided', async () => {
    const mockGetUserMedia = vi.fn().mockResolvedValue('mockStream');
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockImplementation(
      mockGetUserMedia,
    );

    const getUserMedia = getGetUserMedia();
    await getUserMedia({});

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 960 },
        height: { ideal: 600 },
      },
    });
  });

  it('should merge custom constraints with defaults', async () => {
    const mockGetUserMedia = vi.fn().mockResolvedValue('mockStream');
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockImplementation(
      mockGetUserMedia,
    );

    const getUserMedia = getGetUserMedia();
    await getUserMedia({
      video: {
        width: { ideal: 1280 },
        facingMode: 'user',
      },
    });

    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 600 },
        facingMode: 'user',
      },
    });
  });

  it('should allow setting custom getUserMedia function', async () => {
    const customGetUserMedia = vi.fn().mockResolvedValue('customStream');
    setGetUserMedia(customGetUserMedia);

    const getUserMedia = getGetUserMedia();
    const stream = await getUserMedia({ video: true });

    expect(customGetUserMedia).toHaveBeenCalled();
    expect(stream).toBe('customStream');
  });
});
