// src/gameService.ts
import { Gesture } from './gestureService';
import { GameConfig } from './config';

export type GameState = {
  score: number;
  highScore: number;
  currentGesture: Gesture | null;
  remainingTime: number; // 秒単位
  isRunning: boolean;
};

let state: GameState = {
  score: 0,
  highScore: Number(localStorage.getItem('highScore')) || 0,
  currentGesture: null,
  remainingTime: GameConfig.GAME_TIME,
  isRunning: false,
};

export function getGameState(): GameState {
  return state;
}

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

export function stopGame(): void {
  state.isRunning = false;
  // ハイスコアの更新
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('highScore', state.score.toString());
  }
  console.log('ゲームを終了しました:', state);
}

export function updateScore(points: number): void {
  state.score += points;
}

export function selectNextGesture(gestures: Gesture[]): Gesture | null {
  const nextGesture = gestures[Math.floor(Math.random() * gestures.length)];
  state.currentGesture = nextGesture;
  return nextGesture;
}

export const resetState = (initialHighScore?: number): void => {
  state = {
    score: 0,
    highScore:
      initialHighScore ?? Number(localStorage.getItem('highScore') || '100'),
    currentGesture: null,
    remainingTime: GameConfig.GAME_TIME,
    isRunning: false,
  };
};
