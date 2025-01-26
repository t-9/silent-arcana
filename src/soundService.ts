/**
 * サウンドファイルのパスを定義
 */
export const SoundEffects = {
  START_GAME: '/sounds/Cluster_Chimes01-02(Short).mp3',
} as const;

/**
 * サウンドを再生する関数
 * @param soundPath 再生するサウンドファイルのパス
 * @returns 再生の成功・失敗を示すPromise
 */
export async function playSound(soundPath: string): Promise<void> {
  try {
    const audio = new Audio(soundPath);
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
  await playSound(SoundEffects.START_GAME);
} 
