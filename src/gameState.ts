import { Gesture } from './gestureService';

// ゲームの状態を管理する変数
let isRunning = false;
let currentScore = 0;
let currentGesture: string | null = null;
let gestures: Gesture[] = [];

// ゲームの状態を取得・設定する関数
export const isGameRunning = () => isRunning;
export const setGameRunning = (value: boolean) => {
  isRunning = value;
};

export const getCurrentScore = () => currentScore;
export const updateScore = () => {
  currentScore += 1;
};

export const getCurrentGesture = () => currentGesture;
export const setCurrentGesture = (value: string | null) => {
  currentGesture = value;
};

export const getGestures = () => gestures;
export const setGestures = (value: Gesture[]) => {
  gestures = value;
};