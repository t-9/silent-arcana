/**
 * ゲームの状態を管理するモジュール
 */

import { Gesture } from './gestureService';

/** ゲームが実行中かどうかを示すフラグ */
let isRunning = false;
/** 現在のスコア */
let currentScore = 0;
/** 現在のジェスチャー */
let currentGesture: string | null = null;
/** 利用可能なジェスチャーのリスト */
let gestures: Gesture[] = [];

/**
 * ゲームが実行中かどうかを取得する
 * @returns {boolean} ゲームの実行状態
 */
export const isGameRunning = () => isRunning;

/**
 * ゲームの実行状態を設定する
 * @param {boolean} value - 設定する実行状態
 */
export const setGameRunning = (value: boolean) => {
  isRunning = value;
};

/**
 * 現在のスコアを取得する
 * @returns {number} 現在のスコア
 */
export const getCurrentScore = () => currentScore;

/**
 * スコアを1点増加させる
 */
export const updateScore = () => {
  currentScore += 1;
};

/**
 * 現在のジェスチャーを取得する
 * @returns {string | null} 現在のジェスチャー、または未設定の場合はnull
 */
export const getCurrentGesture = () => currentGesture;

/**
 * 現在のジェスチャーを設定する
 * @param {string | null} value - 設定するジェスチャー、またはnull
 */
export const setCurrentGesture = (value: string | null) => {
  currentGesture = value;
};

/**
 * 利用可能なジェスチャーのリストを取得する
 * @returns {Gesture[]} ジェスチャーのリスト
 */
export const getGestures = () => gestures;

/**
 * 利用可能なジェスチャーのリストを設定する
 * @param {Gesture[]} value - 設定するジェスチャーのリスト
 */
export const setGestures = (value: Gesture[]) => {
  gestures = value;
};
