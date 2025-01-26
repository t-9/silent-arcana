import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playSound, playStartGameSound, SoundEffects } from '../soundService';

describe('soundService', () => {
  let audioMock: { play: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Audioのモックを作成
    audioMock = {
      play: vi.fn().mockResolvedValue(undefined),
    };
    vi.spyOn(window, 'Audio').mockImplementation(
      () => audioMock as unknown as HTMLAudioElement,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('playSound', () => {
    it('should create Audio instance and play sound', async () => {
      const testPath = '/test/sound.mp3';
      await playSound(testPath);

      expect(window.Audio).toHaveBeenCalledWith(testPath);
      expect(audioMock.play).toHaveBeenCalled();
    });

    it('should handle playback error', async () => {
      const error = new Error('Audio playback failed');
      audioMock.play.mockRejectedValue(error);

      const consoleSpy = vi.spyOn(console, 'error');
      await expect(playSound('/test/sound.mp3')).rejects.toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        'サウンド再生に失敗しました:',
        error,
      );
    });
  });

  describe('playStartGameSound', () => {
    it('should play start game sound', async () => {
      await playStartGameSound();

      expect(window.Audio).toHaveBeenCalledWith(SoundEffects.START_GAME);
      expect(audioMock.play).toHaveBeenCalled();
    });

    it('should handle playback error', async () => {
      const error = new Error('Audio playback failed');
      audioMock.play.mockRejectedValue(error);

      const consoleSpy = vi.spyOn(console, 'error');
      await expect(playStartGameSound()).rejects.toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        'サウンド再生に失敗しました:',
        error,
      );
    });
  });
});
