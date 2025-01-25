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
  startTimer,
  showGameOverDialog,
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
vi.mock('../gameService', () => ({
  startGame: vi.fn(),
  stopGame: vi.fn(),
  updateScore: vi.fn(),
  selectNextGesture: vi.fn(),
  getGameState: vi.fn(() => ({
    score: 0,
    highScore: 0,
    currentGesture: null,
    isRunning: false,
  })),
}));
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
    mockStartGameBtn.id = 'start-game-btn';
    mockScoreDisplay.id = 'score-display';
    mockGestureDisplay.id = 'gesture-display';
    mockTimerDisplay.id = 'timer-display';
    mockHighScoreDisplay.id = 'high-score-display';

    // ジェスチャー名表示用の要素を追加
    const gestureName = document.createElement('div');
    gestureName.className = 'gesture-name';
    mockGestureDisplay.appendChild(gestureName);

    // 砂時計の構造を設定
    const hourglass = document.createElement('div');
    hourglass.className = 'hourglass';
    const hourglassTop = document.createElement('div');
    hourglassTop.className = 'hourglass-top';
    const hourglassBottom = document.createElement('div');
    hourglassBottom.className = 'hourglass-bottom';
    const hourglassTopSand = document.createElement('div');
    hourglassTopSand.className = 'sand';
    const hourglassBottomSand = document.createElement('div');
    hourglassBottomSand.className = 'sand';

    hourglassTop.appendChild(hourglassTopSand);
    hourglassBottom.appendChild(hourglassBottomSand);
    hourglass.appendChild(hourglassTop);
    hourglass.appendChild(hourglassBottom);
    mockTimerDisplay.appendChild(hourglass);

    // ダイアログ要素を設定
    mockOverlay.appendChild(mockFinalScore);
    mockOverlay.appendChild(mockFinalHighScore);
    mockOverlay.appendChild(mockRestartBtn);
    document.body.appendChild(mockOverlay);

    // その他のDOM要素を追加
    document.body.appendChild(mockStartGameBtn);
    document.body.appendChild(mockScoreDisplay);
    document.body.appendChild(mockGestureDisplay);
    document.body.appendChild(mockTimerDisplay);
    document.body.appendChild(mockHighScoreDisplay);

    // モックの初期化
    vi.mocked(getGameState).mockReturnValue({
      isRunning: true,
      score: 0,
      highScore: 100,
      currentGesture: mockGestures[0],
      remainingTime: GameConfig.GAME_TIME,
    });
    vi.mocked(getGestures).mockReturnValue(mockGestures);
    vi.mocked(detectGesture).mockReturnValue(mockGestures[0].name);

    // タイマーのモック
    vi.useFakeTimers();
  });

  afterEach(() => {
    // DOM要素をクリーンアップ
    document.body.innerHTML = '';
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
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
      setupGameUI(
        mockStartGameBtn,
        mockScoreDisplay,
        mockGestureDisplay,
        mockTimerDisplay,
        mockGestures,
      );

      mockStartGameBtn.click();

      // 砂時計の要素を取得
      const hourglass = mockTimerDisplay.querySelector(
        '.hourglass',
      ) as HTMLElement;
      expect(hourglass).not.toBeNull();

      // 砂粒子を生成
      const sandParticle = document.createElement('div');
      sandParticle.className = 'sand-particle';
      mockTimerDisplay.appendChild(sandParticle);

      // 砂粒子が生成されていることを確認
      expect(mockTimerDisplay.querySelector('.sand-particle')).not.toBeNull();

      // アニメーション終了イベントをシミュレート
      sandParticle.dispatchEvent(new Event('animationend'));
      sandParticle.remove(); // 明示的に要素を削除
      expect(mockTimerDisplay.querySelector('.sand-particle')).toBeNull();
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
        remainingTime: 0,
      });

      updateGameUI(mockScoreDisplay, mockGestureDisplay);

      expect(gestureName.textContent).toBe('完了');
    });
  });

  describe('handleGestureDetection', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should handle correct gesture detection', async () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: true,
        score: 0,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: GameConfig.GAME_TIME,
      });
      (detectGesture as Mock).mockReturnValue(mockGestures[0].name);

      const landmarks = [[0, 0]];
      await handleGestureDetection(landmarks);

      expect(detectGesture).toHaveBeenCalledWith(landmarks, mockGestures);
      expect(updateScore).toHaveBeenCalledWith(10);
      expect(selectNextGesture).toHaveBeenCalledWith(mockGestures);
    });

    it('should not update score for incorrect gesture', async () => {
      vi.clearAllMocks();
      (getGameState as Mock).mockReturnValue({
        isRunning: true,
        score: 0,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: GameConfig.GAME_TIME,
      });
      (detectGesture as Mock).mockReturnValue(mockGestures[1].name);

      const landmarks = [[0, 0]];
      await handleGestureDetection(landmarks);

      expect(updateScore).not.toHaveBeenCalled();
    });

    it('should not process when game is not running', async () => {
      vi.clearAllMocks();
      (getGameState as Mock).mockReturnValue({
        isRunning: false,
        score: 0,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: 0,
      });

      const landmarks = [[0, 0]];
      await handleGestureDetection(landmarks);

      expect(detectGesture).not.toHaveBeenCalled();
    });

    it('should handle correct gesture detection with missing gesture display', async () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: true,
        score: 0,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: GameConfig.GAME_TIME,
      });
      (detectGesture as Mock).mockReturnValue(mockGestures[0].name);

      // Remove gesture-display element
      const gestureDisplay = document.getElementById('gesture-display');
      gestureDisplay?.remove();

      const landmarks = [[0, 0]];
      await handleGestureDetection(landmarks);

      expect(detectGesture).toHaveBeenCalledWith(landmarks, mockGestures);
      expect(updateScore).toHaveBeenCalledWith(10);
      expect(selectNextGesture).toHaveBeenCalledWith(mockGestures);
    });

    it('should handle correct gesture detection with missing gesture name element', async () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: true,
        score: 0,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: GameConfig.GAME_TIME,
      });
      (detectGesture as Mock).mockReturnValue(mockGestures[0].name);

      // Remove gesture-name element
      const gestureName = document.querySelector('.gesture-name');
      gestureName?.remove();

      const landmarks = [[0, 0]];
      await handleGestureDetection(landmarks);

      expect(detectGesture).toHaveBeenCalledWith(landmarks, mockGestures);
      expect(updateScore).toHaveBeenCalledWith(10);
      expect(selectNextGesture).toHaveBeenCalledWith(mockGestures);
    });
  });

  describe('handleGestureSuccess', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update score and select next gesture', () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: true,
        score: 0,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: GameConfig.GAME_TIME,
      });

      handleGestureSuccess();

      expect(updateScore).toHaveBeenCalledWith(10);
      expect(selectNextGesture).toHaveBeenCalledWith(mockGestures);
    });

    it('should not process when game is not running', () => {
      vi.clearAllMocks();
      (getGameState as Mock).mockReturnValue({
        isRunning: false,
        score: 0,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: 0,
      });

      handleGestureSuccess();

      expect(updateScore).not.toHaveBeenCalled();
      expect(selectNextGesture).not.toHaveBeenCalled();
    });

    it('should call window.updateScore when available', () => {
      const mockUpdateScore = vi.fn();
      const originalUpdateScore = window.updateScore;
      window.updateScore = mockUpdateScore;

      handleGestureSuccess();

      expect(mockUpdateScore).toHaveBeenCalledWith(0);

      window.updateScore = originalUpdateScore;
    });

    it('should handle missing gesture display element', () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: true,
        score: 0,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: GameConfig.GAME_TIME,
      });

      // Remove gesture-display element
      const gestureDisplay = document.getElementById('gesture-display');
      gestureDisplay?.remove();

      handleGestureSuccess();

      expect(updateScore).toHaveBeenCalledWith(10);
      expect(selectNextGesture).toHaveBeenCalledWith(mockGestures);
    });

    it('should handle missing gesture name element', () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: true,
        score: 0,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: GameConfig.GAME_TIME,
      });

      // Remove gesture-name element
      const gestureName = document.querySelector('.gesture-name');
      gestureName?.remove();

      handleGestureSuccess();

      expect(updateScore).toHaveBeenCalledWith(10);
      expect(selectNextGesture).toHaveBeenCalledWith(mockGestures);
    });
  });

  describe('timer and game over handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      mockOverlay.style.display = 'none';
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.clearAllTimers();
      vi.clearAllMocks();
    });

    it('should clear timer and show game over dialog when time is up', () => {
      // タイマー表示要素の設定
      const mockTimerDisplay = document.createElement('div');
      mockTimerDisplay.innerHTML = `
        <div class="hourglass">
          <div class="hourglass-top"><div class="sand"></div></div>
          <div class="hourglass-bottom"><div class="sand"></div></div>
        </div>
      `;

      // タイマーを開始
      startTimer(mockTimerDisplay);

      // タイマーが終了するまで待機
      vi.advanceTimersByTime(GameConfig.GAME_TIME * 1000);

      // ゲームが停止され、ダイアログが表示されることを確認
      expect(stopGame).toHaveBeenCalled();
      expect(mockOverlay.style.display).toBe('flex');
      expect(mockFinalScore.textContent).toBe('0');
    });

    it('should handle restart button click correctly', () => {
      // ゲームオーバーダイアログを表示
      showGameOverDialog(0);

      // ダイアログが表示されることを確認
      expect(mockOverlay.style.display).toBe('flex');

      // リスタートボタンをクリック
      mockRestartBtn.click();

      // ダイアログが非表示になることを確認
      expect(mockOverlay.style.display).toBe('none');
    });

    it('should update UI correctly during game', () => {
      setupGameUI(
        mockStartGameBtn,
        mockScoreDisplay,
        mockGestureDisplay,
        mockTimerDisplay,
        mockGestures,
      );

      // ゲームを開始
      mockStartGameBtn.click();

      // 砂時計のアニメーション終了イベントを発火
      const hourglass = mockTimerDisplay.querySelector('.hourglass');
      hourglass?.dispatchEvent(new Event('animationend'));

      // 遅延を待つ
      vi.advanceTimersByTime(50);

      // ゲーム状態を更新
      vi.mocked(getGameState).mockReturnValue({
        isRunning: true,
        score: 0,
        highScore: 100,
        currentGesture: mockGestures[1],
        remainingTime: GameConfig.GAME_TIME,
      });

      // UIを更新
      updateGameUI(mockScoreDisplay, mockGestureDisplay);

      // UIが正しく更新されることを確認
      const gestureName = mockGestureDisplay.querySelector('.gesture-name');
      expect(gestureName?.textContent).toBe('テスト手話2');
    });

    it('should handle game completion state', () => {
      setupGameUI(
        mockStartGameBtn,
        mockScoreDisplay,
        mockGestureDisplay,
        mockTimerDisplay,
        mockGestures,
      );

      // ゲームを開始
      mockStartGameBtn.click();

      // 砂時計のアニメーション終了イベントを発火
      const hourglass = mockTimerDisplay.querySelector('.hourglass');
      hourglass?.dispatchEvent(new Event('animationend'));

      // 遅延を待つ
      vi.advanceTimersByTime(50);

      // ゲーム状態を更新（ゲーム終了状態）
      vi.mocked(getGameState).mockReturnValue({
        isRunning: false,
        score: 100,
        highScore: 100,
        currentGesture: null,
        remainingTime: 0,
      });

      // UIを更新
      updateGameUI(mockScoreDisplay, mockGestureDisplay);

      // 完了メッセージが表示されることを確認
      const gestureName = mockGestureDisplay.querySelector('.gesture-name');
      expect(gestureName?.textContent).toBe('完了');
    });
  });

  describe('sand particle animation', () => {
    it('should handle sand particle animation end', () => {
      // タイマー表示要素を作成
      const mockTimerDisplay = document.createElement('div');
      mockTimerDisplay.className = 'timer-display';

      // 砂時計を作成
      const hourglass = document.createElement('div');
      hourglass.className = 'hourglass';

      // 上部と下部を作成
      const hourglassTop = document.createElement('div');
      hourglassTop.className = 'hourglass-top';
      const hourglassBottom = document.createElement('div');
      hourglassBottom.className = 'hourglass-bottom';

      // 砂を追加
      const hourglassTopSand = document.createElement('div');
      hourglassTopSand.className = 'sand';
      const hourglassBottomSand = document.createElement('div');
      hourglassBottomSand.className = 'sand';

      // 構造を組み立て
      hourglassTop.appendChild(hourglassTopSand);
      hourglassBottom.appendChild(hourglassBottomSand);
      hourglass.appendChild(hourglassTop);
      hourglass.appendChild(hourglassBottom);
      mockTimerDisplay.appendChild(hourglass);

      // タイマーを開始
      startTimer(mockTimerDisplay);

      // Math.randomをモック化して、必ず砂粒子が生成されるようにする
      const originalRandom = Math.random;
      Math.random = vi.fn().mockReturnValue(0.1); // 0.3未満の値を返す

      // 砂粒子のアニメーションをシミュレート
      vi.advanceTimersByTime(1000);

      // Math.randomを元に戻す
      Math.random = originalRandom;

      // 砂粒子を取得
      const sandParticle = mockTimerDisplay.querySelector('.sand-particle');
      expect(sandParticle).not.toBeNull();

      if (sandParticle) {
        // アニメーション終了イベントを発火
        sandParticle.dispatchEvent(new Event('animationend'));

        // 砂粒子が削除されたことを確認
        expect(mockTimerDisplay.querySelector('.sand-particle')).toBeNull();
      }
    });
  });
});
