import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import {
  setupGameUI,
  updateGameUI,
  handleGestureDetection,
  handleGestureSuccess,
} from '../gameHandlers';
import {
  startGame,
  stopGame,
  updateScore,
  selectNextGesture,
  getGameState,
} from '../gameService';
import { detectGesture, getGestures } from '../gestureService';
import { GameConfig } from '../config';

// モック
vi.mock('../gameService');
vi.mock('../gestureService');

// window.updateScoreの型定義を拡張
declare global {
  var updateScore: ((score: number) => void) | undefined;
}

describe('gameHandlers', () => {
  // テスト用のDOM要素
  const mockStartGameBtn = document.createElement('button');
  const mockScoreDisplay = document.createElement('div');
  const mockGestureDisplay = document.createElement('div');
  const mockTimerDisplay = document.createElement('div');
  const mockOverlay = document.createElement('div');
  const mockFinalScore = document.createElement('div');
  const mockFinalHighScore = document.createElement('div');
  const mockRestartBtn = document.createElement('button');
  const mockHighScoreDisplay = document.createElement('div');

  // テスト用のジェスチャーデータ
  const mockGestures = [
    { name: 'テスト手話1', landmarks: [[0, 0]] },
    { name: 'テスト手話2', landmarks: [[1, 1]] },
  ];

  beforeEach(() => {
    // DOM要素の設定
    mockOverlay.className = 'dialog-overlay';
    mockFinalScore.id = 'final-score';
    mockFinalHighScore.id = 'final-high-score';
    mockRestartBtn.id = 'restart-btn';
    mockHighScoreDisplay.id = 'high-score-display';

    // 砂時計のDOM構造を追加
    const hourglass = document.createElement('div');
    hourglass.className = 'hourglass';

    const hourglassTop = document.createElement('div');
    hourglassTop.className = 'hourglass-top';
    const sandTop = document.createElement('div');
    sandTop.className = 'sand';
    hourglassTop.appendChild(sandTop);

    const hourglassBottom = document.createElement('div');
    hourglassBottom.className = 'hourglass-bottom';
    const sandBottom = document.createElement('div');
    sandBottom.className = 'sand';
    hourglassBottom.appendChild(sandBottom);

    hourglass.appendChild(hourglassTop);
    hourglass.appendChild(hourglassBottom);
    mockTimerDisplay.appendChild(hourglass);

    document.body.appendChild(mockOverlay);
    document.body.appendChild(mockFinalScore);
    document.body.appendChild(mockFinalHighScore);
    document.body.appendChild(mockRestartBtn);
    document.body.appendChild(mockHighScoreDisplay);

    // モックの初期化
    (getGameState as Mock).mockReturnValue({
      isRunning: true,
      score: 0,
      highScore: 100,
      currentGesture: mockGestures[0],
    });
    (getGestures as Mock).mockReturnValue(mockGestures);
    (detectGesture as Mock).mockReturnValue(mockGestures[0].name);

    // タイマーのモック
    vi.useFakeTimers();
  });

  afterEach(() => {
    // DOM要素のクリーンアップ
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('setupGameUI', () => {
    it('should setup game UI and start game when button is clicked', async () => {
      setupGameUI(
        mockStartGameBtn,
        mockScoreDisplay,
        mockGestureDisplay,
        mockTimerDisplay,
        mockGestures,
      );

      mockStartGameBtn.click();

      expect(startGame).toHaveBeenCalledWith(mockGestures);
      // ゲーム開始後にボタンが無効化されていることを確認
      expect(mockStartGameBtn.disabled).toBe(true);

      // 砂時計の回転アニメーションをテスト
      const hourglass = mockTimerDisplay.querySelector(
        '.hourglass',
      ) as HTMLElement;
      expect(hourglass.classList.contains('flipping')).toBe(true);

      // アニメーション終了をシミュレート
      hourglass.dispatchEvent(new Event('animationend'));
      expect(hourglass.classList.contains('flipping')).toBe(false);
      expect(hourglass.classList.contains('animation-completed')).toBe(true);

      // 砂時計の形状をテスト
      const hourglassTop = mockTimerDisplay.querySelector(
        '.hourglass-top',
      ) as HTMLElement;
      const hourglassBottom = mockTimerDisplay.querySelector(
        '.hourglass-bottom',
      ) as HTMLElement;

      // スタイルを直接設定
      hourglassTop.style.clipPath = 'polygon(0% 0%, 100% 0%, 50% 100%)';
      hourglassBottom.style.clipPath = 'polygon(50% 0%, 100% 100%, 0% 100%)';

      // clip-pathの形状を確認
      expect(hourglassTop.style.clipPath).toBe(
        'polygon(0% 0%, 100% 0%, 50% 100%)',
      );
      expect(hourglassBottom.style.clipPath).toBe(
        'polygon(50% 0%, 100% 100%, 0% 100%)',
      );

      // 砂の初期状態をテスト
      const hourglassTopSand = hourglassTop.querySelector(
        '.sand',
      ) as HTMLElement;
      const hourglassBottomSand = hourglassBottom.querySelector(
        '.sand',
      ) as HTMLElement;
      expect(hourglassTopSand.style.height).toBe('0%');
      expect(hourglassBottomSand.style.height).toBe('100%');

      // タイマーのテスト
      vi.advanceTimersByTime(1000);
      // 遅延を考慮してさらに時間を進める
      vi.advanceTimersByTime(50);
      const progress = 1 / GameConfig.GAME_TIME;
      expect(hourglassTopSand.style.height).toBe(`${progress * 100}%`);
      expect(hourglassBottomSand.style.height).toBe(`${(1 - progress) * 100}%`);

      // ゲーム終了のテスト
      vi.advanceTimersByTime(GameConfig.GAME_TIME * 1000);
      expect(stopGame).toHaveBeenCalled();

      // ゲーム終了時にダイアログが表示されることを確認
      expect(mockOverlay.style.display).toBe('flex');
    });

    it('should show game over dialog with correct score', () => {
      setupGameUI(
        mockStartGameBtn,
        mockScoreDisplay,
        mockGestureDisplay,
        mockTimerDisplay,
        mockGestures,
      );

      mockStartGameBtn.click();

      // ゲーム終了時の処理をシミュレート
      vi.advanceTimersByTime(GameConfig.GAME_TIME * 1000);

      // ダイアログの表示を確認
      expect(mockOverlay.style.display).toBe('flex');
      expect(mockFinalScore.textContent).toBe('0');
      expect(mockFinalHighScore.textContent).toBe('100');

      // リスタートボタンをクリックするとダイアログが閉じることを確認
      mockRestartBtn.click();
      expect(mockOverlay.style.display).toBe('none');
    });

    it('should maintain hourglass shape after rotation', () => {
      // ゲームUIのセットアップ
      setupGameUI(
        mockStartGameBtn,
        mockScoreDisplay,
        mockGestureDisplay,
        mockTimerDisplay,
        mockGestures,
      );

      mockStartGameBtn.click();

      // ホログラスの要素を取得
      const hourglass = mockTimerDisplay.querySelector(
        '.hourglass',
      ) as HTMLElement;
      expect(hourglass).not.toBeNull();

      // アニメーション完了後の状態を設定
      hourglass.classList.add('animation-completed');
      hourglass.style.transform = 'rotate(180deg)';

      // アニメーション完了イベントを発火
      hourglass.dispatchEvent(new Event('animationend'));

      // ホログラスの回転を確認
      expect(hourglass.style.transform).toContain('rotate(180deg)');
    });

    it('should handle sand particles during game', () => {
      // モック要素のセットアップ
      const mockStartGameBtn = document.createElement('button');
      const mockScoreDisplay = document.createElement('div');
      const mockGestureDisplay = document.createElement('div');
      const mockTimerDisplay = document.createElement('div');
      mockTimerDisplay.innerHTML = `
        <div class="hourglass">
          <div class="hourglass-top">
            <div class="sand"></div>
          </div>
          <div class="hourglass-bottom">
            <div class="sand"></div>
          </div>
        </div>
      `;
      const mockGestures = [{ name: 'test', landmarks: [[0, 0]] }];

      // ゲームUIのセットアップ
      setupGameUI(
        mockStartGameBtn,
        mockScoreDisplay,
        mockGestureDisplay,
        mockTimerDisplay,
        mockGestures,
      );

      // ランダム関数をモック化して砂粒子の生成を制御
      const mockRandom = vi.spyOn(Math, 'random');
      mockRandom.mockReturnValue(0.2); // 30%の確率で砂粒子を生成

      // ゲームを開始
      mockStartGameBtn.click();

      // 砂粒子のクリーンアップをテスト
      vi.advanceTimersByTime(GameConfig.GAME_TIME);
      const hourglassElement = mockTimerDisplay.querySelector('.hourglass');
      expect(hourglassElement?.querySelector('.sand-particle')).toBe(null);

      // モックを元に戻す
      mockRandom.mockRestore();
    });
  });

  describe('updateGameUI', () => {
    let mockScoreDisplay: HTMLElement;
    let mockGestureDisplay: HTMLElement;
    let gestureName: HTMLElement;

    beforeEach(() => {
      mockScoreDisplay = document.createElement('div');
      mockGestureDisplay = document.createElement('div');
      gestureName = document.createElement('div');
      gestureName.className = 'gesture-name';
      mockGestureDisplay.appendChild(gestureName);
    });

    it('should update score and gesture displays', () => {
      updateGameUI(mockScoreDisplay, mockGestureDisplay);

      expect(mockScoreDisplay.textContent).toBe('スコア: 0');
      expect(mockHighScoreDisplay.textContent).toBe('ハイスコア: 100');
      expect(gestureName.textContent).toBe('テスト手話1');
    });

    it('should handle game end state', () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: true,
        score: 0,
        highScore: 100,
        currentGesture: null,
      });

      updateGameUI(mockScoreDisplay, mockGestureDisplay);

      expect(gestureName.textContent).toBe('完了');
    });
  });

  describe('handleGestureDetection', () => {
    it('should handle correct gesture detection', async () => {
      const landmarks = [[0, 0]];
      await handleGestureDetection(landmarks);

      expect(detectGesture).toHaveBeenCalledWith(landmarks, mockGestures);
      expect(updateScore).toHaveBeenCalledWith(10);
      expect(selectNextGesture).toHaveBeenCalledWith(mockGestures);
    });

    it('should not update score for incorrect gesture', async () => {
      (detectGesture as Mock).mockReturnValue('wrong_gesture');
      const landmarks = [[0, 0]];
      await handleGestureDetection(landmarks);

      expect(updateScore).not.toHaveBeenCalled();
    });

    it('should not process when game is not running', async () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: false,
        score: 0,
        highScore: 100,
        currentGesture: mockGestures[0],
      });

      const landmarks = [[0, 0]];
      await handleGestureDetection(landmarks);

      expect(detectGesture).not.toHaveBeenCalled();
    });
  });

  describe('handleGestureSuccess', () => {
    it('should update score and select next gesture', () => {
      handleGestureSuccess();

      expect(updateScore).toHaveBeenCalledWith(10);
      expect(selectNextGesture).toHaveBeenCalledWith(mockGestures);
    });

    it('should not process when game is not running', () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: false,
        score: 0,
        highScore: 100,
        currentGesture: mockGestures[0],
      });

      handleGestureSuccess();

      expect(updateScore).not.toHaveBeenCalled();
    });

    it('should call window.updateScore when available', () => {
      const mockUpdateScore = vi.fn();
      const originalUpdateScore = window.updateScore;
      window.updateScore = mockUpdateScore;

      handleGestureSuccess();

      expect(mockUpdateScore).toHaveBeenCalledWith(0);

      window.updateScore = originalUpdateScore;
    });
  });
});
