import { describe, it, expect, beforeEach } from 'vitest';
import {
  isGameRunning,
  setGameRunning,
  getCurrentScore,
  updateScore,
  getCurrentGesture,
  setCurrentGesture,
  getGestures,
  setGestures,
} from '../gameState';
import { Gesture } from '../gestureService';

describe('gameState', () => {
  beforeEach(() => {
    // 各テストの前にゲームの状態をリセット
    setGameRunning(false);
    setCurrentGesture(null);
    setGestures([]);
    // スコアはupdateScoreでしか変更できないため、直接リセットはできない
  });

  describe('game running state', () => {
    it('should have default value as false', () => {
      expect(isGameRunning()).toBe(false);
    });

    it('should set and get running state', () => {
      setGameRunning(true);
      expect(isGameRunning()).toBe(true);

      setGameRunning(false);
      expect(isGameRunning()).toBe(false);
    });
  });

  describe('score management', () => {
    it('should have default value as 0', () => {
      expect(getCurrentScore()).toBe(0);
    });

    it('should increment score', () => {
      const initialScore = getCurrentScore();
      updateScore();
      expect(getCurrentScore()).toBe(initialScore + 1);
    });

    it('should increment score multiple times', () => {
      const initialScore = getCurrentScore();
      const incrementCount = 3;

      for (let i = 0; i < incrementCount; i++) {
        updateScore();
      }

      expect(getCurrentScore()).toBe(initialScore + incrementCount);
    });
  });

  describe('current gesture', () => {
    it('should have default value as null', () => {
      expect(getCurrentGesture()).toBeNull();
    });

    it('should set and get gesture', () => {
      const testGesture = 'test-gesture';
      setCurrentGesture(testGesture);
      expect(getCurrentGesture()).toBe(testGesture);
    });

    it('should set gesture to null', () => {
      const testGesture = 'test-gesture';
      setCurrentGesture(testGesture);
      setCurrentGesture(null);
      expect(getCurrentGesture()).toBeNull();
    });
  });

  describe('gestures list', () => {
    it('should have default value as empty array', () => {
      expect(getGestures()).toEqual([]);
    });

    it('should set and get gestures', () => {
      const testGestures: Gesture[] = [
        { name: 'gesture1', landmarks: [[0, 0]] },
        { name: 'gesture2', landmarks: [[1, 1]] },
      ];
      setGestures(testGestures);
      expect(getGestures()).toEqual(testGestures);
    });

    it('should set empty array', () => {
      const testGestures: Gesture[] = [
        { name: 'gesture1', landmarks: [[0, 0]] },
      ];
      setGestures(testGestures);
      setGestures([]);
      expect(getGestures()).toEqual([]);
    });

    it('should not modify original array', () => {
      const testGestures: Gesture[] = [
        { name: 'gesture1', landmarks: [[0, 0]] },
      ];
      setGestures(testGestures);

      const gestures = getGestures();
      gestures.push({ name: 'gesture2', landmarks: [[1, 1]] });

      expect(getGestures()).toEqual(testGestures);
    });
  });
});
