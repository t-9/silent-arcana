// src/gameHandlers.ts
import { startGame, stopGame, updateScore, selectNextGesture, getGameState } from './gameService';
import { detectGesture, Gesture } from './gestureService';
import { getDetector } from './modelService';

/**
 * カメラ映像から手のキーポイントを取得する関数
 */
async function getHandKeypoints(videoEl: HTMLVideoElement) {
  const detector = getDetector();
  if (!detector) {
    console.error('HandDetectorが利用できません');
    return [];
  }

  const hands = await detector.estimateHands(videoEl);
  if (hands.length === 0) {
    console.warn('手が検出されていません');
    return [];
  }

  return hands[0].keypoints;
}

export function setupGameUI(
  startBtn: HTMLElement,
  scoreDisplay: HTMLElement,
  gestureDisplay: HTMLElement,
  timerDisplay: HTMLElement,
  gestures: Gesture[],
) {
  let timerInterval: NodeJS.Timeout;

  startBtn.addEventListener('click', () => {
    startGame(gestures);

    timerInterval = setInterval(() => {
      const state = getGameState();
      if (state.remainingTime <= 0) {
        clearInterval(timerInterval);
        stopGame();
        alert(`ゲーム終了! スコア: ${state.score}`);
        return;
      }

      state.remainingTime -= 1;
      timerDisplay.textContent = `残り時間: ${state.remainingTime} 秒`;
    }, 1000);

    updateGameUI(scoreDisplay, gestureDisplay);
  });
}

function updateGameUI(scoreDisplay: HTMLElement, gestureDisplay: HTMLElement) {
  const state = getGameState();

  scoreDisplay.textContent = `スコア: ${state.score}`;
  if (state.currentGesture) {
    gestureDisplay.textContent = `手話を実行してください: ${state.currentGesture.name}`;
  }
}

export async function handleGestureDetection(
  videoEl: HTMLVideoElement,
  messageEl: HTMLElement,
  gestures: Gesture[],
) {
  const keypoints = await getHandKeypoints(videoEl); // 修正済み
  const detectedGesture = detectGesture(keypoints, gestures);

  if (detectedGesture) {
    updateScore(10);
    messageEl.textContent = `正解! ジェスチャー: ${detectedGesture}`;
    selectNextGesture(gestures);
  } else {
    messageEl.textContent = '該当する手話が見つかりません';
  }
}
