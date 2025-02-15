/**
 * アプリケーション全体で使用される型定義を提供するモジュール
 */

/**
 * ジェスチャーの情報を表すインターフェース
 */
export interface Gesture {
  /** ジェスチャーの名前 */
  name: string;
  /** ジェスチャーのランドマーク座標の配列（[x, y, z]の配列） */
  landmarks: [number, number, number][];
}
