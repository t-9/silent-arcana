// src/gameService.ts
import { Gesture } from './gestureService';
import { GameConfig } from './config';

/**
 * ゲームの状態を表す型定義
 */
export type GameState = {
  /** 現在のスコア */
  score: number;
  /** ハイスコア */
  highScore: number;
  /** 現在のジェスチャー */
  currentGesture: Gesture | null;
  /** 残り時間（秒） */
  remainingTime: number;
  /** ゲームが実行中かどうか */
  isRunning: boolean;
};

let state: GameState = {
  score: 0,
  highScore: Number(localStorage.getItem('highScore')) || 0,
  currentGesture: null,
  remainingTime: GameConfig.GAME_TIME,
  isRunning: false,
};

/**
 * 現在のゲーム状態を取得する
 * @returns {GameState} 現在のゲーム状態
 */
export function getGameState(): GameState {
  return state;
}

/**
 * ゲームを開始する
 * @param {Gesture[]} gestures - 利用可能なジェスチャーの配列
 */
export function startGame(gestures: Gesture[]): void {
  if (!gestures || gestures.length === 0) {
    console.error('ジェスチャーデータが読み込まれていません');
    return;
  }

  state = {
    score: 0,
    highScore: Number(localStorage.getItem('highScore')) || 0,
    currentGesture: selectNextGesture(gestures),
    remainingTime: GameConfig.GAME_TIME,
    isRunning: true,
  };
  console.log('ゲームを開始しました:', state);
}

/**
 * ゲームを停止し、必要に応じてハイスコアを更新する
 */
export function stopGame(): void {
  state.isRunning = false;
  // ハイスコアの更新
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('highScore', state.score.toString());
  }
  console.log('ゲームを終了しました:', state);
}

/**
 * スコアを更新する
 * @param {number} points - 追加するポイント
 */
export function updateScore(points: number): void {
  state.score += points;
}

/**
 * 次のランダムなジェスチャーを選択する
 * @param {Gesture[]} gestures - 利用可能なジェスチャーの配列
 * @returns {Gesture | null} 選択されたジェスチャー
 */
export function selectNextGesture(gestures: Gesture[]): Gesture | null {
  const nextGesture = gestures[Math.floor(Math.random() * gestures.length)];
  state.currentGesture = nextGesture;
  return nextGesture;
}

/**
 * ゲームの状態をリセットする
 * @param {number} [initialHighScore] - 初期ハイスコア（省略可能）
 */
export const resetState = (initialHighScore?: number): void => {
  state = {
    score: 0,
    highScore:
      initialHighScore ?? Number(localStorage.getItem('highScore') ?? '100'),
    currentGesture: null,
    remainingTime: GameConfig.GAME_TIME,
    isRunning: false,
  };
};
