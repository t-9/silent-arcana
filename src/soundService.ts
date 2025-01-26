/**
 * サウンドファイルのパスを定義
 */
export const SoundEffects = {
  START_GAME: '/sounds/Cluster_Chimes01-02(Short).mp3',
} as const;

// プリロードされた音声を保持するMap
const preloadedSounds = new Map<string, HTMLAudioElement>();

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
    // プリロードされた音声があればそれを使用
    const preloadedAudio = preloadedSounds.get(soundPath);
    if (preloadedAudio) {
      // 再生位置をリセット（同じ音声を連続で再生できるように）
      preloadedAudio.currentTime = 0;
      await preloadedAudio.play();
    } else {
      // プリロードされていない場合は従来通り新しいAudioインスタンスを作成
      const audio = new Audio(soundPath);
      await audio.play();
    }
  } catch (error) {
    console.error('サウンド再生に失敗しました:', error);
    throw error;
  }
}

/**
 * ゲーム開始時のサウンドを再生
 */
export async function playStartGameSound(): Promise<void> {
  await playSound(SoundEffects.START_GAME);
}
