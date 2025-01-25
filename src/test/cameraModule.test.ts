import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getGetUserMedia, setGetUserMedia } from '../cameraModule';

describe('cameraModule', () => {
  const mockStream = new MediaStream();
  const mockGetUserMedia = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    setGetUserMedia(mockGetUserMedia);
  });

  it('should return MediaStream when getUserMedia succeeds', async () => {
    mockGetUserMedia.mockResolvedValue(mockStream);
    const getUserMedia = getGetUserMedia();
    const stream = await getUserMedia({});
    expect(stream).toBe(mockStream);
  });

  it('should throw error when getUserMedia fails', async () => {
    const error = new Error('Camera access denied');
    mockGetUserMedia.mockRejectedValue(error);
    const getUserMedia = getGetUserMedia();
    await expect(getUserMedia({})).rejects.toThrow('Camera access denied');
  });
});
