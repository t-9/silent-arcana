// src/test/app.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { init } from '../app';
import { loadGestureData } from '../gestureService';
import { loadModel } from '../modelService';

// モックの設定
vi.mock('../gestureService', () => ({
  loadGestureData: vi.fn().mockResolvedValue([
    { name: 'test-gesture', landmarks: [[0, 0, 0]] }
  ])
}));

vi.mock('../modelService', () => ({
  loadModel: vi.fn().mockResolvedValue(undefined),
  startDetection: vi.fn(),
  detectLoop: vi.fn()
}));

vi.mock('../cameraService', () => ({
  startCamera: vi.fn().mockResolvedValue(undefined)
}));

describe('app', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // DOMの設定
    document.body.innerHTML = `
      <video id="video"></video>
      <div id="loading"></div>
      <div id="message"></div>
      <button id="start-game-btn"></button>
      <div id="score-display"></div>
      <div id="gesture-display"></div>
      <div id="timer-display"></div>
    `;
  });

  it('should initialize app with all required components', async () => {
    await init();

    expect(loadModel).toHaveBeenCalled();
    expect(loadGestureData).toHaveBeenCalled();

    // ボタンが有効化されていることを確認
    const startGameBtn = document.getElementById('start-game-btn') as HTMLButtonElement;
    expect(startGameBtn.disabled).toBe(false);
  });
});
