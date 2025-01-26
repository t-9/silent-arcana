import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Mock } from 'vitest';
import {
  SoundEffects,
  playSound,
  preloadSounds,
  playStartGameSound,
  preloadedSounds,
} from '../soundService';

// プライベートな変数にアクセスするためのインターフェース
declare global {
  var preloadedSounds: Map<string, HTMLAudioElement>;
}

describe('soundService', () => {
  let audioMock: {
    play: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    currentTime: number;
  };

  beforeEach(() => {
    // Audioのモックを作成
    audioMock = {
      play: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockResolvedValue(undefined),
      currentTime: 0,
    };
    vi.spyOn(window, 'Audio').mockImplementation(
      () => audioMock as unknown as HTMLAudioElement,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('preloadSounds', () => {
    it('should preload all sound effects successfully', async () => {
      await preloadSounds();
      expect(window.Audio).toHaveBeenCalledWith(SoundEffects.START_GAME);
      expect(audioMock.load).toHaveBeenCalled();
    });

    it('should handle preload error', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      audioMock.load.mockRejectedValue(new Error('Failed to load audio'));

      await preloadSounds();

      expect(consoleSpy).toHaveBeenCalledWith(
        'サウンドのプリロードに失敗しました:',
        expect.any(Error),
      );
    });
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

    it('should reuse preloaded audio and reset currentTime', async () => {
      // まずプリロード
      await preloadSounds();

      // プリロードされた音声を使って再生
      await playStartGameSound();

      // Audio インスタンスが新しく作られていないことを確認
      // preloadSoundsで3つのインスタンスが作成され、playStartGameSoundでは新しいインスタンスは作成されない
      expect(window.Audio).toHaveBeenCalledTimes(3);

      // currentTime がリセットされ、再生されたことを確認
      expect(audioMock.currentTime).toBe(0);
      expect(audioMock.play).toHaveBeenCalled();
    });
  });

  describe('playStartGameSound', () => {
    let audioMock: { play: Mock; currentTime: number };

    beforeEach(() => {
      audioMock = {
        play: vi.fn().mockResolvedValue(undefined),
        currentTime: 1,
      };
      vi.spyOn(window, 'Audio').mockImplementation(
        () => audioMock as unknown as HTMLAudioElement,
      );
      preloadedSounds.clear();
    });

    it('should play start game sound when not preloaded', async () => {
      await playStartGameSound();
      expect(window.Audio).toHaveBeenCalledWith(SoundEffects.START_GAME);
      expect(audioMock.play).toHaveBeenCalled();
    });

    it('should reuse preloaded audio', async () => {
      const preloadedAudio = {
        play: vi.fn().mockResolvedValue(undefined),
        currentTime: 1, // 初期値を1に設定して、リセットされることを確認
      };
      preloadedSounds.set(
        SoundEffects.START_GAME,
        preloadedAudio as unknown as HTMLAudioElement,
      );

      await playStartGameSound();
      expect(window.Audio).not.toHaveBeenCalled();
      expect(preloadedAudio.currentTime).toBe(0);
      expect(preloadedAudio.play).toHaveBeenCalled();
    });

    it('should handle playback error', async () => {
      const error = new Error('rejected promise');
      audioMock.play.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error');

      await expect(playStartGameSound()).rejects.toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        'ゲーム開始音の再生に失敗しました:',
        error,
      );
    });
  });
});
