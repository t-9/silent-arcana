// gameHandlers.ts
import {
  startGame,
  stopGame,
  updateScore,
  selectNextGesture,
  getGameState,
} from './gameService';
import { detectGesture, Gesture, getGestures } from './gestureService';
import { GameConfig } from './config';

// windowオブジェクトの型を拡張
declare global {
  interface Window {
    updateScore: (score: number) => void;
  }
}

/**
 * ゲーム終了時のダイアログを表示
 */
function showGameOverDialog(score: number) {
  const overlay = document.querySelector('.dialog-overlay') as HTMLElement;
  const finalScore = document.getElementById('final-score') as HTMLElement;
  const finalHighScore = document.getElementById(
    'final-high-score',
  ) as HTMLElement;
  const restartBtn = document.getElementById('restart-btn') as HTMLElement;

  const state = getGameState();
  finalScore.textContent = score.toString();
  finalHighScore.textContent = state.highScore.toString();
  overlay.style.display = 'flex';

  // リスタートボタンのイベントリスナー
  restartBtn.onclick = () => {
    overlay.style.display = 'none';
    // ゲームの状態をリセット
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
      startGameBtn.click();
    }
  };
}

/**
 * ゲームのUIを設定し、開始ボタンの動作を実装
 */
export function setupGameUI(
  startGameBtn: HTMLElement,
  scoreDisplay: HTMLElement,
  gestureDisplay: HTMLElement,
  timerDisplay: HTMLElement,
  gestures: Gesture[],
) {
  let timerInterval: NodeJS.Timeout;

  // ゲーム開始ボタンの動作
  startGameBtn.addEventListener('click', () => {
    // ダイアログが表示されている場合は非表示にする
    const overlay = document.querySelector('.dialog-overlay') as HTMLElement;
    overlay.style.display = 'none';

    startGame(gestures); // ゲームロジックの初期化
    updateGameUI(scoreDisplay, gestureDisplay); // UIの初期更新

    // 称号システムのリセット
    if (typeof window.updateScore === 'function') {
      window.updateScore(0);
    }

    let timeRemaining = GameConfig.GAME_TIME;
    timerDisplay.textContent = `残り時間: ${timeRemaining} 秒`;

    // タイマー処理
    timerInterval = setInterval(() => {
      timeRemaining -= 1;
      timerDisplay.textContent = `残り時間: ${timeRemaining} 秒`;

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        stopGame();
        showGameOverDialog(getGameState().score);
      }
    }, 1000);
  });
}

/**
 * UIのスコアやジェスチャー表示を更新
 */
export function updateGameUI(
  scoreDisplay: HTMLElement,
  gestureDisplay: HTMLElement,
) {
  const state = getGameState();

  // スコア表示を更新
  scoreDisplay.textContent = `スコア: ${state.score}`;

  // ハイスコア表示を更新
  const highScoreDisplay = document.getElementById('high-score-display');
  if (highScoreDisplay) {
    highScoreDisplay.textContent = `ハイスコア: ${state.highScore}`;
  }

  // 次のジェスチャー表示を更新
  if (state.currentGesture) {
    const gestureName = gestureDisplay.querySelector('.gesture-name');
    if (gestureName) {
      gestureName.textContent = state.currentGesture.name;
    }
  } else {
    const gestureName = gestureDisplay.querySelector('.gesture-name');
    if (gestureName) {
      gestureName.textContent = '完了';
    }
  }
}

/**
 * 手話の検出を処理 (ゲーム中はこちらを呼ぶ)
 */
export async function handleGestureDetection(
  landmarks: number[][],
): Promise<void> {
  const state = getGameState();
  if (!state.isRunning || !state.currentGesture) return;

  const gestures = getGestures();
  const detectedGesture = detectGesture(landmarks, gestures);
  if (detectedGesture === state.currentGesture.name) {
    // スコアを更新
    updateScore(10);

    // 称号システムの更新
    if (typeof window.updateScore === 'function') {
      window.updateScore(state.score);
    }

    // 次のジェスチャーを選択
    const nextGesture = selectNextGesture(gestures);

    // UI更新
    const gestureDisplay = document.getElementById('gesture-display');
    if (gestureDisplay && nextGesture) {
      const gestureName = gestureDisplay.querySelector('.gesture-name');
      if (gestureName) {
        gestureName.textContent = nextGesture.name;
      }
    }
  }
}

export function handleGestureSuccess(): void {
  const state = getGameState();
  if (!state.isRunning) return;

  // スコアを更新
  updateScore(10);

  // 称号システムの更新
  if (typeof window.updateScore === 'function') {
    window.updateScore(state.score);
  }

  // 次のジェスチャーを選択
  const gestures = getGestures();
  const nextGesture = selectNextGesture(gestures);

  // UI更新
  const gestureDisplay = document.getElementById('gesture-display');
  if (gestureDisplay && nextGesture) {
    const gestureName = gestureDisplay.querySelector('.gesture-name');
    if (gestureName) {
      gestureName.textContent = nextGesture.name;
    }
  }
}
