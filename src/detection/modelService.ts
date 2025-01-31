// modelService.ts
import { HandDetector } from '@tensorflow-models/hand-pose-detection';
import { createHandDetector } from './detectionModule';
import { Gesture, loadGestureData, detectGesture } from '../gestureService';
import { getGameState } from '../gameService'; // ★追加: ゲーム状態を参照
import { handleGestureDetection } from '../gameHandlers'; // ★追加: ゲーム用ハンドラを呼ぶ
import { setLoadingText } from '../uiUtils';
import { toRelativeLandmarks } from '../logic';

let detector: HandDetector | null = null;
let running = false;
const loadedGestures: Gesture[] = [];

// Detectorを外から取得するためのゲッター
export function getDetector(): HandDetector | null {
  return detector;
}

/**
 * モデルの読み込みと、手話用ジェスチャーデータの読み込み
 */
export async function loadModel(
  setLoading: (text: string | boolean) => void,
): Promise<HandDetector> {
  const messageEl = document.getElementById('message');
  if (!messageEl) {
    throw new Error('メッセージ要素が見つかりません');
  }

  // setLoadingをオーバーライドして、messageElを使用するように変更
  const originalSetLoading = setLoading;
  setLoading = (text: string | boolean) => {
    originalSetLoading(text);
    setLoadingText(messageEl, String(text));
  };

  setLoading('モデルを読み込んでいます...');

  try {
    detector = await createHandDetector();
    console.log('MediaPipe Handsモデル読み込み完了');
    setLoading('');

    // ジェスチャーデータの読み込み
    try {
      const gestures = await loadGestureData();
      if (gestures && gestures.length > 0) {
        loadedGestures.length = 0; // 既存のデータをクリア
        loadedGestures.push(...gestures); // 新しいデータを追加
        console.log('ジェスチャーデータ読み込み完了:', loadedGestures);
      } else {
        loadedGestures.length = 0;
        console.warn('ジェスチャーデータが空です');
      }
    } catch (e) {
      console.error('ジェスチャーデータの読み込みに失敗:', e);
      throw e;
    }

    return detector;
  } catch (err) {
    const errorText = 'モデルの読み込みに失敗しました';
    console.error(errorText, err);
    setLoading(errorText);
    throw err;
  }
}

/**
 * ゲーム中の手の検出処理
 */
async function handleGameDetection(
  videoEl: HTMLVideoElement,
  messageEl: HTMLElement,
): Promise<void> {
  const hands = await detector?.estimateHands(videoEl);
  if (hands && hands.length > 0) {
    const normalizedKeypoints = toRelativeLandmarks(hands[0].keypoints);
    await handleGestureDetection(normalizedKeypoints);
  }
  // ゲーム中はメッセージ表示を行わない
  setLoadingText(messageEl, '');
}

/**
 * ゲーム外の手の検出処理
 */
async function handleNonGameDetection(
  videoEl: HTMLVideoElement,
  messageEl: HTMLElement,
): Promise<void> {
  const hands = await detector?.estimateHands(videoEl);
  if (hands && hands.length > 0) {
    const normalizedKeypoints = toRelativeLandmarks(hands[0].keypoints);
    if (loadedGestures.length > 0) {
      const gestureName = detectGesture(normalizedKeypoints, loadedGestures);
      if (gestureName) {
        setLoadingText(messageEl, `検出された手話: ${gestureName}`);
      } else {
        setLoadingText(messageEl, '該当する手話が見つかりません');
      }
    } else {
      setLoadingText(messageEl, '手話データが読み込まれていません');
    }
  } else {
    setLoadingText(messageEl, '手が検出されていません');
  }
}

/**
 * 推定ループ (非同期で再帰呼び出し)
 */
export async function detectLoop(
  videoEl: HTMLVideoElement,
  messageEl: HTMLElement,
): Promise<void> {
  if (!running || !detector) return;

  // ビデオ要素が正しく設定されているか確認
  if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
    console.error('ビデオが適切に初期化されていません');
    setLoadingText(messageEl, 'ビデオの初期化に失敗しました');
  } else {
    // ゲームが進行中かどうかを判定
    const gameState = getGameState();
    if (gameState.isRunning) {
      await handleGameDetection(videoEl, messageEl);
    } else {
      await handleNonGameDetection(videoEl, messageEl);
    }
  }

  // 再帰的に呼び出してループ継続
  requestAnimationFrame(() => {
    detectLoop(videoEl, messageEl);
  });
}

/** 推定を開始する */
export function startDetection() {
  running = true;
}

/** 推定を停止する */
export function stopDetection() {
  running = false;
}
