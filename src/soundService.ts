/**
 * サウンドファイルのパスを定義
 */
export const SoundEffects = {
  START_GAME: './sounds/Cluster_Chimes01-02(Short).mp3',
  CARD_CHANGE: './sounds/Time_Card_Rack01-1(Take_Out).mp3',
  GAME_OVER: './sounds/Bell_Accent08-2(Bell_Only).mp3',
} as const;

// プリロードされた音声を保持するMap
export const preloadedSounds = new Map<string, HTMLAudioElement>();

/**
 * サウンドファイルをプリロードする
 * @returns プリロードの完了を示すPromise
 */
export async function preloadSounds(): Promise<void> {
  try {
    const soundEffects = Object.values(SoundEffects);
    await Promise.all(
      soundEffects.map(async (effect) => {
        const audio = new Audio(effect);
        audio.load();
        preloadedSounds.set(effect, audio);
      }),
    );
    console.log('サウンドのプリロードが完了しました');
  } catch (error) {
    console.error('サウンドのプリロードに失敗しました:', error);
    throw error;
  }
}

/**
 * サウンドを再生する関数
 * @param soundPath 再生するサウンドファイルのパス
 * @returns 再生の成功・失敗を示すPromise
 */
export async function playSound(soundPath: string): Promise<void> {
  try {
    let audio: HTMLAudioElement;
    // プリロードされた音声があればそれを使用
    const preloadedAudio = preloadedSounds.get(soundPath);
    if (preloadedAudio) {
      audio = preloadedAudio;
    } else {
      // プリロードされていない場合は新しいAudioインスタンスを作成
      audio = new Audio(soundPath);
    }
    // 再生位置をリセット（同じ音声を連続で再生できるように）
    audio.currentTime = 0;
    await audio.play();
  } catch (error) {
    console.error('サウンド再生に失敗しました:', error);
    throw error;
  }
}

/**
 * ゲーム開始時のサウンドを再生
 */
export async function playStartGameSound(): Promise<void> {
  try {
    await playSound(SoundEffects.START_GAME);
  } catch (error) {
    console.error('ゲーム開始音の再生に失敗しました:', error);
    throw error;
  }
}

/**
 * カード切り替え時のサウンドを再生
 */
export async function playCardChangeSound(): Promise<void> {
  try {
    await playSound(SoundEffects.CARD_CHANGE);
  } catch (error) {
    console.error('カード切り替え音の再生に失敗しました:', error);
    throw error;
  }
}

/**
 * 複数の音声を同時に再生する関数
 * @param soundPaths 再生する音声ファイルのパスの配列
 * @returns 再生の成功・失敗を示すPromise
 */
export async function playMultipleSounds(soundPaths: string[]): Promise<void> {
  try {
    await Promise.all(soundPaths.map(playSound));
  } catch (error) {
    console.error('複数の音声の再生に失敗しました:', error);
    throw error;
  }
}

/**
 * ゲーム開始時とカード切り替え時のサウンドを同時に再生
 */
export async function playStartGameAndCardChangeSound(): Promise<void> {
  try {
    await playMultipleSounds([
      SoundEffects.START_GAME,
      SoundEffects.CARD_CHANGE,
    ]);
  } catch (error) {
    console.error('ゲーム開始音とカード切り替え音の再生に失敗しました:', error);
    throw error;
  }
}

/**
 * ゲーム終了時のサウンドを再生
 */
export async function playGameOverSound(): Promise<void> {
  try {
    await playSound(SoundEffects.GAME_OVER);
  } catch (error) {
    console.error('ゲーム終了音の再生に失敗しました:', error);
    throw error;
  }
}
