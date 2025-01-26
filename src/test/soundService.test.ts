import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Mock } from 'vitest';
import {
  SoundEffects,
  playSound,
  preloadSounds,
  playStartGameSound,
  playCardChangeSound,
  playMultipleSounds,
  playStartGameAndCardChangeSound,
  playGameOverSound,
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
      audioMock.load.mockRejectedValue(new Error('Failed to load audio'));

      try {
        await preloadSounds();
      } catch (error) {
        // エラーは期待通り
        expect(error).toBeInstanceOf(Error);
      }
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

  describe('playCardChangeSound', () => {
    it('should play card change sound', async () => {
      await playCardChangeSound();
      expect(window.Audio).toHaveBeenCalledWith(SoundEffects.CARD_CHANGE);
      expect(audioMock.play).toHaveBeenCalled();
    });

    it('should handle playback error', async () => {
      const error = new Error('Card change sound playback failed');
      audioMock.play.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error');

      await expect(playCardChangeSound()).rejects.toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        'カード切り替え音の再生に失敗しました:',
        error,
      );
    });
  });

  describe('playMultipleSounds', () => {
    it('should play multiple sounds simultaneously', async () => {
      const soundPaths = [SoundEffects.START_GAME, SoundEffects.CARD_CHANGE];
      await playMultipleSounds(soundPaths);

      expect(window.Audio).toHaveBeenCalledWith(SoundEffects.START_GAME);
      expect(window.Audio).toHaveBeenCalledWith(SoundEffects.CARD_CHANGE);
      expect(audioMock.play).toHaveBeenCalledTimes(2);
    });

    it('should handle playback error', async () => {
      const error = new Error('Multiple sounds playback failed');
      audioMock.play.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error');

      await expect(
        playMultipleSounds([SoundEffects.START_GAME, SoundEffects.CARD_CHANGE]),
      ).rejects.toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        '複数の音声の再生に失敗しました:',
        error,
      );
    });
  });

  describe('playStartGameAndCardChangeSound', () => {
    it('should play both start game and card change sounds', async () => {
      await playStartGameAndCardChangeSound();

      expect(window.Audio).toHaveBeenCalledWith(SoundEffects.START_GAME);
      expect(window.Audio).toHaveBeenCalledWith(SoundEffects.CARD_CHANGE);
      expect(audioMock.play).toHaveBeenCalledTimes(2);
    });

    it('should handle playback error', async () => {
      const error = new Error('Combined sounds playback failed');
      audioMock.play.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error');

      await expect(playStartGameAndCardChangeSound()).rejects.toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        'ゲーム開始音とカード切り替え音の再生に失敗しました:',
        error,
      );
    });
  });

  describe('playGameOverSound', () => {
    it('should play game over sound', async () => {
      await playGameOverSound();
      expect(window.Audio).toHaveBeenCalledWith(SoundEffects.GAME_OVER);
      expect(audioMock.play).toHaveBeenCalled();
    });

    it('should handle playback error', async () => {
      const error = new Error('Game over sound playback failed');
      audioMock.play.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error');

      await expect(playGameOverSound()).rejects.toThrow(error);
      expect(consoleSpy).toHaveBeenCalledWith(
        'ゲーム終了音の再生に失敗しました:',
        error,
      );
    });
  });
});
