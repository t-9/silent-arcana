// src/gameService.ts
import { Gesture } from './gestureService';

export type GameState = {
  score: number;
  currentGesture: Gesture | null;
  remainingTime: number; // 秒単位
  isRunning: boolean;
};

const GAME_TIME = 60; // ゲーム全体の制限時間(秒)
let state: GameState = {
  score: 0,
  currentGesture: null,
  remainingTime: GAME_TIME,
  isRunning: false,
};

export function getGameState(): GameState {
  return state;
}

export function startGame(gestures: Gesture[]): void {
  state = {
    score: 0,
    currentGesture: gestures[0] || null,
    remainingTime: GAME_TIME,
    isRunning: true,
  };
  console.log('ゲームを開始しました:', state);
}

export function stopGame(): void {
  state.isRunning = false;
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
