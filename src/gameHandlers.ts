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

// タイマー関連の変数をモジュールスコープに移動
let timerInterval: NodeJS.Timeout;
let timeRemaining: number;
let sandParticles: HTMLElement[] = [];

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
    // ゲームを直接再開始
    const gestures = getGestures();
    startGame(gestures);

    // ゲーム開始ボタンを無効化したままにする
    const startGameBtn = document.getElementById(
      'start-game-btn',
    ) as HTMLButtonElement;
    if (startGameBtn) {
      startGameBtn.setAttribute('disabled', 'true');
    }

    // UI要素を取得
    const scoreDisplay = document.getElementById('score-display');
    const gestureDisplay = document.getElementById('gesture-display');
    const timerDisplay = document.getElementById('timer-display');

    if (scoreDisplay && gestureDisplay && timerDisplay) {
      // UIを更新
      updateGameUI(scoreDisplay, gestureDisplay);

      // 称号システムのリセット
      if (typeof window.updateScore === 'function') {
        window.updateScore(0);
      }

      // 砂時計のリセットと開始
      const hourglass = timerDisplay.querySelector('.hourglass') as HTMLElement;
      const hourglassTopSand = timerDisplay.querySelector(
        '.hourglass-top .sand',
      ) as HTMLElement;
      const hourglassBottomSand = timerDisplay.querySelector(
        '.hourglass-bottom .sand',
      ) as HTMLElement;

      // 初期状態でトランジションを無効化
      hourglassTopSand.style.transition = 'none';
      hourglassBottomSand.style.transition = 'none';
      hourglassTopSand.style.height = '0%';
      hourglassBottomSand.style.height = '100%';

      // 砂時計を回転させる
      hourglass.classList.add('flipping');

      // アニメーション終了時の処理
      hourglass.addEventListener(
        'animationend',
        () => {
          hourglass.classList.remove('flipping');
          hourglass.classList.add('animation-completed');

          // 回転後は元の上部が下部になっているので、砂は元の下部（今の上部）に100%の状態から開始
          hourglassTopSand.style.height = '0%';
          hourglassBottomSand.style.height = '100%';

          // 少し遅延を入れてからトランジションを有効化し、タイマーを開始
          setTimeout(() => {
            hourglassTopSand.style.transition = 'height 0.5s ease-in-out';
            hourglassBottomSand.style.transition = 'height 0.5s ease-in-out';
            // タイマーの開始
            startTimer(timerDisplay);
          }, 50);
        },
        { once: true },
      );
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
  // ゲーム開始ボタンの動作
  startGameBtn.addEventListener('click', () => {
    // ダイアログが表示されている場合は非表示にする
    const overlay = document.querySelector('.dialog-overlay') as HTMLElement;
    overlay.style.display = 'none';

    startGame(gestures); // ゲームロジックの初期化
    updateGameUI(scoreDisplay, gestureDisplay); // UIの初期更新

    // ゲーム開始ボタンを無効化
    startGameBtn.setAttribute('disabled', 'true');

    // 称号システムのリセット
    if (typeof window.updateScore === 'function') {
      window.updateScore(0);
    }

    // 砂時計の要素を取得
    const hourglass = timerDisplay.querySelector('.hourglass') as HTMLElement;
    const hourglassTopSand = timerDisplay.querySelector(
      '.hourglass-top .sand',
    ) as HTMLElement;
    const hourglassBottomSand = timerDisplay.querySelector(
      '.hourglass-bottom .sand',
    ) as HTMLElement;

    // 初期状態でトランジションを無効化
    hourglassTopSand.style.transition = 'none';
    hourglassBottomSand.style.transition = 'none';
    hourglassTopSand.style.height = '0%';
    hourglassBottomSand.style.height = '100%';

    // 砂時計を回転させる
    hourglass.classList.add('flipping');

    // アニメーション終了時の処理
    hourglass.addEventListener(
      'animationend',
      () => {
        hourglass.classList.remove('flipping');
        hourglass.classList.add('animation-completed');

        // 回転後は元の上部が下部になっているので、砂は元の下部（今の上部）に100%の状態から開始
        hourglassTopSand.style.height = '0%';
        hourglassBottomSand.style.height = '100%';

        // 少し遅延を入れてからトランジションを有効化し、タイマーを開始
        setTimeout(() => {
          hourglassTopSand.style.transition = 'height 0.5s ease-in-out';
          hourglassBottomSand.style.transition = 'height 0.5s ease-in-out';
          // タイマーの開始
          startTimer(timerDisplay);
        }, 50);
      },
      { once: true },
    );
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

/**
 * タイマーを開始する関数
 */
function startTimer(timerDisplay: HTMLElement) {
  const hourglassTopSand = timerDisplay.querySelector(
    '.hourglass-top .sand',
  ) as HTMLElement;
  const hourglassBottomSand = timerDisplay.querySelector(
    '.hourglass-bottom .sand',
  ) as HTMLElement;
  const totalTime = GameConfig.GAME_TIME;
  timeRemaining = totalTime;

  timerInterval = setInterval(() => {
    timeRemaining -= 1;

    // 砂時計のアニメーション
    const progress = (totalTime - timeRemaining) / totalTime;
    // 回転後は逆向きに砂が落ちるように計算を反転
    const topHeight = progress * 100;
    const bottomHeight = (1 - progress) * 100;

    hourglassTopSand.style.height = `${topHeight}%`;
    hourglassBottomSand.style.height = `${bottomHeight}%`;

    // 砂粒子のアニメーション
    if (timeRemaining > 0 && Math.random() < 0.3) {
      // 30%の確率で粒子を生成
      addSandParticle(timerDisplay);
    }

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      // 残っている砂粒子を削除
      sandParticles.forEach((particle) => particle.remove());
      sandParticles = [];
      stopGame();
      showGameOverDialog(getGameState().score);
    }
  }, 1000);
}

/**
 * 砂粒子を追加する関数
 */
function addSandParticle(timerDisplay: HTMLElement) {
  const particle = document.createElement('div');
  particle.className = 'sand-particle';
  const hourglass = timerDisplay.querySelector('.hourglass');
  if (hourglass) {
    hourglass.appendChild(particle);
    sandParticles.push(particle);

    // アニメーション終了時に粒子を削除
    particle.addEventListener('animationend', () => {
      particle.remove();
      sandParticles = sandParticles.filter((p) => p !== particle);
    });
  }
}
