/**
 * ゲームの設定値
 */
export const GameConfig = {
  /** ゲームの制限時間（秒） */
  GAME_TIME: 30,

  /** 1回の正解で獲得できるスコア */
  SCORE_PER_GESTURE: 10,

  /** 称号の閾値 */
  RANK_THRESHOLDS: {
    BEGINNER: 0, // 見習い魔術師
    INTERMEDIATE: 50, // 初級魔導士
    ADVANCED: 100, // 中級魔導士
    EXPERT: 200, // 上級魔導士
    MASTER: 300, // 大魔導士
  },
} as const;
