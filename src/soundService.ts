/**
 * サウンドファイルのパスを定義
 */
export const SoundEffects = {
  START_GAME: '/sounds/Cluster_Chimes01-02(Short).mp3',
  CARD_CHANGE: '/sounds/Time_Card_Rack01-1(Take_Out).mp3',
} as const;

// プリロードされた音声を保持するMap
export const preloadedSounds = new Map<string, HTMLAudioElement>();

/**
 * サウンドファイルをプリロードする
 * @returns プリロードの完了を示すPromise
 */
export async function preloadSounds(): Promise<void> {
  try {
    const loadPromises = Object.values(SoundEffects).map(async (soundPath) => {
      const audio = new Audio(soundPath);
      // load()を呼び出して明示的にロードを開始
      await audio.load();
      preloadedSounds.set(soundPath, audio);
    });

    await Promise.all(loadPromises);
    console.log('サウンドのプリロードが完了しました');
  } catch (error) {
    console.error('サウンドのプリロードに失敗しました:', error);
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
      // プリロードされた音声をクローンして使用（同時再生のため）
      audio = preloadedAudio.cloneNode(true) as HTMLAudioElement;
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
    await playMultipleSounds([SoundEffects.START_GAME, SoundEffects.CARD_CHANGE]);
  } catch (error) {
    console.error('ゲーム開始音とカード切り替え音の再生に失敗しました:', error);
    throw error;
  }
}
