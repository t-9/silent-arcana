/**
 * ゲームの設定値を管理するモジュール
 */

/**
 * ゲームの設定値オブジェクト
 * @const {Object} GameConfig
 * @property {number} GAME_TIME - ゲームの制限時間（秒）
 * @property {number} SCORE_PER_GESTURE - 1回の正解で獲得できるスコア
 * @property {Object} RANK_THRESHOLDS - 各称号の獲得に必要なスコアの閾値
 * @property {number} RANK_THRESHOLDS.BEGINNER - 見習い魔術師の閾値
 * @property {number} RANK_THRESHOLDS.INTERMEDIATE - 初級魔導士の閾値
 * @property {number} RANK_THRESHOLDS.ADVANCED - 中級魔導士の閾値
 * @property {number} RANK_THRESHOLDS.EXPERT - 上級魔導士の閾値
 * @property {number} RANK_THRESHOLDS.MASTER - 大魔導士の閾値
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
