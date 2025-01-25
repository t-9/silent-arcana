import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCreateDetector,
  setCreateDetector,
  createHandDetector,
} from '../detectionModule';
import {
  SupportedModels,
  HandDetector,
  createDetector as realCreateDetector,
} from '@tensorflow-models/hand-pose-detection';

describe('detectionModule', () => {
  describe('getCreateDetector and setCreateDetector', () => {
    it('should have realCreateDetector as default', () => {
      const createDetector = getCreateDetector();
      expect(createDetector).toBeDefined();
    });

    it('should set and get custom createDetector', () => {
      const mockCreateDetector = vi.fn();
      setCreateDetector(mockCreateDetector);
      expect(getCreateDetector()).toBe(mockCreateDetector);
    });
  });

  describe('createHandDetector', () => {
    let mockDetector: HandDetector;
    let mockCreateDetector: ReturnType<typeof vi.fn<typeof realCreateDetector>>;

    beforeEach(() => {
      mockDetector = {
        estimateHands: vi.fn(),
      } as unknown as HandDetector;
      mockCreateDetector = vi.fn().mockResolvedValue(mockDetector);
      setCreateDetector(mockCreateDetector);
    });

    it('should create detector with default config', async () => {
      await createHandDetector();

      expect(mockCreateDetector).toHaveBeenCalledWith(
        SupportedModels.MediaPipeHands,
        {
          runtime: 'tfjs',
          modelType: 'full',
        },
      );
    });

    it('should return created detector', async () => {
      const detector = await createHandDetector();
      expect(detector).toBe(mockDetector);
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to create detector');
      mockCreateDetector.mockRejectedValue(error);

      await expect(createHandDetector()).rejects.toThrow(error);
    });
  });
});
