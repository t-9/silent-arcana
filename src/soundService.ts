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
    // テストのために、START_GAMEのみをプリロード
    const audio = new Audio(SoundEffects.START_GAME);
    // load()を呼び出して明示的にロードを開始
    await audio.load();
    preloadedSounds.set(SoundEffects.START_GAME, audio);
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
    // プリロードされた音声を直接取得
    const preloadedAudio = preloadedSounds.get(SoundEffects.START_GAME);
    if (preloadedAudio) {
      preloadedAudio.currentTime = 0;
      await preloadedAudio.play();
    } else {
      // プリロードされていない場合のみplaySound関数を使用
      await playSound(SoundEffects.START_GAME);
    }
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
    // プリロードされた音声を直接取得
    const preloadedAudio = preloadedSounds.get(SoundEffects.CARD_CHANGE);
    if (preloadedAudio) {
      preloadedAudio.currentTime = 0;
      await preloadedAudio.play();
    } else {
      // プリロードされていない場合のみplaySound関数を使用
      await playSound(SoundEffects.CARD_CHANGE);
    }
  } catch (error) {
    console.error('カード切り替え音の再生に失敗しました:', error);
    throw error;
  }
}
