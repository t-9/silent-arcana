// gameHandlers.ts
import {
  startGame,
  stopGame,
  updateScore,
  selectNextGesture,
  getGameState,
} from './gameService';
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
    startGame(gestures); // ゲームロジックの初期化
    updateGameUI(scoreDisplay, gestureDisplay); // UIの初期更新

    let timeRemaining = 60; // タイマーの設定（秒単位）
    timerDisplay.textContent = `残り時間: ${timeRemaining} 秒`;

    // タイマー処理
    timerInterval = setInterval(() => {
      timeRemaining -= 1;
      timerDisplay.textContent = `残り時間: ${timeRemaining} 秒`;

      if (timeRemaining <= 0) {
        clearInterval(timerInterval); // タイマー停止
        stopGame(); // ゲーム終了ロジック
        alert(`ゲーム終了！ スコア: ${getGameState().score}`);
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

  // 次のジェスチャー表示を更新
  if (state.currentGesture) {
    gestureDisplay.textContent = `手話を実行してください: ${state.currentGesture.name}`;
  } else {
    gestureDisplay.textContent = 'すべてのジェスチャーが終了しました';
  }
}

/**
 * 手話の検出を処理 (ゲーム中はこちらを呼ぶ)
 */
export async function handleGestureDetection(
  videoEl: HTMLVideoElement,
  messageEl: HTMLElement,
  gestures: Gesture[],
) {
  // 手のキーポイントを取得
  const keypoints = await getHandKeypoints(videoEl);
  if (!keypoints || keypoints.length === 0) {
    messageEl.textContent = '手が検出されていません';
    return;
  }

  // データからジェスチャー名を推定
  const detectedGesture = detectGesture(keypoints, gestures);
  if (!detectedGesture) {
    messageEl.textContent = '該当する手話が見つかりません';
    return;
  }

  // 現在のゲーム状態・現在のジェスチャーを取得
  const state = getGameState();
  if (!state.currentGesture) {
    // もう手話が残っていない場合
    messageEl.textContent = 'ゲームは終了しています';
    return;
  }

  // 「現在のジェスチャーと一致した」場合のみスコア加算 & 次の手話へ
  if (detectedGesture === state.currentGesture.name) {
    console.log(`正解ジェスチャー検出: ${detectedGesture}`);
    updateScore(10);
    messageEl.textContent = `正解！ジェスチャー: ${detectedGesture}`;

    // 次のジェスチャーへ (ランダムに選択する想定)
    const nextGesture = selectNextGesture(gestures);
    if (nextGesture) {
      messageEl.textContent += ` / 次の手話: ${nextGesture.name}`;
    } else {
      messageEl.textContent += ' / 手話リストが終了しました';
    }
  } else {
    // 手話は検出されたが、現在のジェスチャーと違う場合
    messageEl.textContent = `違う手話です: ${detectedGesture}`;
  }

  // ゲームUIを更新
  updateGameUI(
    document.getElementById('score-display')!,
    document.getElementById('gesture-display')!,
  );
}
