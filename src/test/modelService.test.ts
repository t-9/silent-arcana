// src/test/modelService.test.ts
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import {
  getDetector,
  loadModel,
  detectLoop,
  startDetection,
  stopDetection,
} from '../modelService';
import { createHandDetector } from '../detection/detectionModule';
import { loadGestureData, detectGesture } from '../gestureService';
import { getGameState } from '../gameService';
import { handleGestureDetection } from '../gameHandlers';

// モック用の型定義
type MockDetector = {
  estimateHands: Mock;
};

// モック
vi.mock('../detection/detectionModule');
vi.mock('../gestureService');
vi.mock('../gameService');
vi.mock('../gameHandlers');

describe('modelService', () => {
  const mockDetector = {
    estimateHands: vi.fn(),
  } as MockDetector;

  const mockSetLoading = vi.fn();
  const mockVideoEl = {
    videoWidth: 640,
    videoHeight: 480,
  } as HTMLVideoElement;
  const mockMessageEl = document.createElement('div');

  beforeEach(() => {
    vi.clearAllMocks();
    // message要素を作成してbodyに追加
    const messageEl = document.createElement('div');
    messageEl.id = 'message';
    document.body.appendChild(messageEl);

    // デフォルトのモック実装
    (createHandDetector as Mock).mockResolvedValue(mockDetector);
    (loadGestureData as Mock).mockResolvedValue([
      { name: 'テスト手話', landmarks: [[0, 0, 0]] },
    ]);
    (getGameState as unknown as Mock).mockReturnValue({ isRunning: false });
    mockDetector.estimateHands.mockResolvedValue([
      {
        keypoints: [
          { x: 0, y: 0, name: 'point1' },
          { x: 1, y: 1, name: 'point2' },
        ],
      },
    ]);

    // requestAnimationFrameのモック
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      // 即座にコールバックを実行する
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    // テスト後にmessage要素を削除
    const messageEl = document.getElementById('message');
    if (messageEl) {
      messageEl.remove();
    }
    document.body.innerHTML = '';
  });

  describe('getDetector', () => {
    it('should return null by default', () => {
      expect(getDetector()).toBeNull();
    });
  });

  describe('loadModel', () => {
    it('should load model and gesture data successfully', async () => {
      const detector = await loadModel(mockSetLoading);

      expect(createHandDetector).toHaveBeenCalled();
      expect(loadGestureData).toHaveBeenCalled();
      expect(detector).toBe(mockDetector);
      expect(mockSetLoading).toHaveBeenCalledWith(
        'モデルを読み込んでいます...',
      );
      expect(mockSetLoading).toHaveBeenCalledWith('');
    });

    it('should handle model loading error', async () => {
      const error = new Error('Model loading failed');
      (createHandDetector as Mock).mockRejectedValue(error);

      await expect(loadModel(mockSetLoading)).rejects.toThrow();
      expect(mockSetLoading).toHaveBeenCalledWith(
        'モデルを読み込んでいます...',
      );
    });

    it('should handle gesture data loading error', async () => {
      const error = new Error('Gesture data loading failed');
      (loadGestureData as Mock).mockRejectedValue(error);

      await expect(loadModel(mockSetLoading)).rejects.toThrow(
        'Gesture data loading failed',
      );
      expect(createHandDetector).toHaveBeenCalled();
      expect(mockSetLoading).toHaveBeenCalledWith(
        'モデルを読み込んでいます...',
      );
    });

    it('should handle missing message element', async () => {
      document.body.innerHTML = ''; // メッセージ要素を削除
      await expect(loadModel(mockSetLoading)).rejects.toThrow(
        'メッセージ要素が見つかりません',
      );
    });
  });

  describe('detectLoop', () => {
    beforeEach(async () => {
      // 事前にモデルを読み込む
      await loadModel(mockSetLoading);
      startDetection();
    });

    it('should handle game state detection', async () => {
      (getGameState as unknown as Mock).mockReturnValue({ isRunning: true });

      await detectLoop(mockVideoEl, mockMessageEl);

      expect(mockDetector.estimateHands).toHaveBeenCalledWith(mockVideoEl);
      expect(handleGestureDetection).toHaveBeenCalled();
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should handle non-game state detection', async () => {
      (getGameState as unknown as Mock).mockReturnValue({ isRunning: false });
      (detectGesture as Mock).mockReturnValue('テスト手話');

      await detectLoop(mockVideoEl, mockMessageEl);

      expect(mockDetector.estimateHands).toHaveBeenCalledWith(mockVideoEl);
      expect(detectGesture).toHaveBeenCalled();
      expect(mockMessageEl.textContent).toContain('テスト手話');
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should handle no hands detected', async () => {
      mockDetector.estimateHands.mockResolvedValue([]);

      await detectLoop(mockVideoEl, mockMessageEl);

      expect(mockMessageEl.textContent).toBe('手が検出されていません');
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should handle invalid video element', async () => {
      const invalidVideoEl = {
        videoWidth: 0,
        videoHeight: 0,
      } as HTMLVideoElement;

      await detectLoop(invalidVideoEl, mockMessageEl);

      expect(mockMessageEl.textContent).toBe('ビデオの初期化に失敗しました');
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    //
    // ★ ここから追加テスト (行 106-107 のカバレッジを取得) ★
    //
    it('should show "手話データが読み込まれていません" if gestures are not loaded when hands are detected', async () => {
      // まず stopDetection + モデルを再読み込みして loadedGestures を空にする
      stopDetection();
      (loadGestureData as Mock).mockResolvedValue([]); // 空配列にモック変更
      await loadModel(mockSetLoading); // ここでloadedGesturesが空になる
      startDetection();

      await detectLoop(mockVideoEl, mockMessageEl);

      // handsが検出されるモック → loadedGestures.length === 0 → 該当の分岐を通る
      expect(mockDetector.estimateHands).toHaveBeenCalledWith(mockVideoEl);
      expect(mockMessageEl.textContent).toBe(
        '手話データが読み込まれていません',
      );
    });
  });

  describe('startDetection and stopDetection', () => {
    beforeEach(async () => {
      // 事前にモデルを読み込む
      await loadModel(mockSetLoading);
    });

    it('should control detection state', async () => {
      startDetection();
      await detectLoop(mockVideoEl, mockMessageEl);
      expect(mockDetector.estimateHands).toHaveBeenCalled();

      stopDetection();
      mockDetector.estimateHands.mockClear();
      await detectLoop(mockVideoEl, mockMessageEl);
      expect(mockDetector.estimateHands).not.toHaveBeenCalled();
    });
  });
});
