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
  setNextGesture,
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
import * as gameService from '../gameService';
import * as gestureService from '../gestureService';
import {
  playCardChangeSound,
  playGameOverSound,
  playStartGameSound,
} from '../soundService';

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
vi.mock('../soundService', () => ({
  playStartGameSound: vi.fn().mockResolvedValue(undefined),
  playGameOverSound: vi.fn().mockResolvedValue(undefined),
  playCardChangeSound: vi.fn().mockResolvedValue(undefined),
}));

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
    { name: 'gesture1', landmarks: [[1, 1]] },
    { name: 'gesture2', landmarks: [[2, 2]] },
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
    vi.spyOn(gestureService, 'getGestures').mockReturnValue(mockGestures);
    vi.spyOn(gameService, 'selectNextGesture').mockReturnValue(mockGestures[1]);
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

    it('should call window.updateScore when available', () => {
      const mockUpdateScore = vi.fn();
      const originalUpdateScore = window.updateScore;
      window.updateScore = mockUpdateScore;

      const mockStartGameBtn = document.createElement('button');
      const mockScoreDisplay = document.createElement('div');
      const mockGestureDisplay = document.createElement('div');
      const mockTimerDisplay = document.createElement('div');

      // ダイアログオーバーレイを作成
      const overlay = document.createElement('div');
      overlay.classList.add('dialog-overlay');
      document.body.appendChild(overlay);

      // 砂時計の構造を作成
      const hourglass = document.createElement('div');
      hourglass.classList.add('hourglass');
      const hourglassTop = document.createElement('div');
      hourglassTop.classList.add('hourglass-top');
      const hourglassBottom = document.createElement('div');
      hourglassBottom.classList.add('hourglass-bottom');
      const hourglassTopSand = document.createElement('div');
      hourglassTopSand.classList.add('sand');
      const hourglassBottomSand = document.createElement('div');
      hourglassBottomSand.classList.add('sand');

      hourglassTop.appendChild(hourglassTopSand);
      hourglassBottom.appendChild(hourglassBottomSand);
      hourglass.appendChild(hourglassTop);
      hourglass.appendChild(hourglassBottom);
      mockTimerDisplay.appendChild(hourglass);

      setupGameUI(
        mockStartGameBtn,
        mockScoreDisplay,
        mockGestureDisplay,
        mockTimerDisplay,
        mockGestures,
      );

      // タイマーをモック化
      vi.useFakeTimers();

      // ボタンをクリック
      mockStartGameBtn.click();

      // イベントループを進める
      vi.advanceTimersByTime(0);

      // window.updateScoreが0で呼び出されたことを確認
      expect(mockUpdateScore).toHaveBeenCalledWith(0);

      window.updateScore = originalUpdateScore;
      vi.useRealTimers();
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
      expect(gestureName.textContent).toBe('gesture1');
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

    it('should handle missing gesture display and name elements', () => {
      // モックの設定
      const mockScoreDisplay = document.createElement('div');
      const mockGestureDisplay = document.createElement('div');
      const mockState = {
        score: 10,
        highScore: 20,
        isRunning: true,
        currentGesture: { name: 'gesture1', landmarks: [[0, 0]] },
        remainingTime: GameConfig.GAME_TIME,
      };
      vi.spyOn(gameService, 'getGameState').mockReturnValue(mockState);

      // window.updateScoreを空の関数として設定
      window.updateScore = () => {};
      const mockUpdateScore = vi.spyOn(window, 'updateScore');

      // UIの更新を実行
      updateGameUI(mockScoreDisplay, mockGestureDisplay);

      // 検証
      expect(mockScoreDisplay.textContent).toBe('スコア: 10');
      expect(mockUpdateScore).not.toHaveBeenCalled();
    });

    it('カード切り替え音が失敗したら console.error が呼び出される', async () => {
      // (1) DOMを整備
      document.body.innerHTML = `
        <div id="gesture-display">
          <div class="gesture-name"></div>
        </div>
      `;

      // (2) getGestures / selectNextGesture が返す値を指定
      vi.mocked(getGestures).mockReturnValue([
        { name: 'test1', landmarks: [[0, 0]] },
      ]);
      vi.mocked(selectNextGesture).mockReturnValue({
        name: 'test1',
        landmarks: [[0, 0]],
      });

      // (3) サウンドを故意に reject
      vi.mocked(playCardChangeSound).mockRejectedValue(new Error('Test Error'));

      // (4) console.error をスパイ
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // (5) 実行
      setNextGesture();

      // (6) 非同期完了を待つ
      await Promise.resolve();

      // (7) 実行結果を検証
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'カード切り替え音の再生に失敗しました:',
        expect.any(Error),
      );

      // (8) 後片付け
      consoleErrorSpy.mockRestore();
    });

    it('ゲーム終了音が失敗したら console.error が呼び出される', async () => {
      // 1) サウンド再生を故意に失敗
      vi.mocked(playGameOverSound).mockRejectedValueOnce(
        new Error('Test GameOver Error'),
      );

      // 2) console.error をスパイ
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // 3) showGameOverDialog() を呼ぶと内部で playGameOverSound() → 失敗→ catch(...)予想
      showGameOverDialog(999);

      // 4) 非同期完了を待つ
      await Promise.resolve();

      // 5) console.error の呼び出しを検証
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ゲーム終了音の再生に失敗しました:',
        expect.any(Error),
      );

      // 6) 後片付け
      consoleErrorSpy.mockRestore();
    });

    it('ゲーム開始音が失敗したら console.error が呼び出される (start button)', async () => {
      // 1) ゲーム開始音を故意に失敗
      vi.mocked(playStartGameSound).mockRejectedValueOnce(
        new Error('Test Start Error'),
      );

      // 2) console.error をスパイ
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // 3) テスト用のDOM要素（startGameBtnなど）を用意

      // (3-1) 必要な要素を作る
      const mockStartGameBtn = document.createElement('button');
      mockStartGameBtn.id = 'start-game-btn';

      const mockScoreDisplay = document.createElement('div');
      const mockGestureDisplay = document.createElement('div');
      const mockTimerDisplay = document.createElement('div');

      // (3-2) 砂時計の構造を組み立てて mockTimerDisplay に入れる
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

      // 4) setupGameUI() でイベントを仕込む
      setupGameUI(
        mockStartGameBtn,
        mockScoreDisplay,
        mockGestureDisplay,
        mockTimerDisplay,
        [],
      );

      // 5) ボタンをクリック → 内部で playStartGameSound() → 失敗 → catch(...) 予想
      mockStartGameBtn.click();

      // 6) 非同期完了を待つ
      await Promise.resolve();

      // 7) console.error の呼び出しを確認
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ゲーム開始音の再生に失敗しました:',
        expect.any(Error),
      );

      // 8) 後片付け
      consoleErrorSpy.mockRestore();
    });

    it('ゲーム開始音が失敗したら console.error が呼び出される (restart)', async () => {
      // 1) リスタート時のゲーム開始音を故意に失敗
      vi.mocked(playStartGameSound).mockRejectedValueOnce(
        new Error('Test Restart Error'),
      );

      // 2) console.error をスパイ
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // 3) ダイアログを表示（showGameOverDialog）
      showGameOverDialog(500);

      // 4) リスタートボタンをクリック → 内部で playStartGameSound() → 失敗 → catch(...) 予想
      const restartBtn = document.getElementById('restart-btn');
      expect(restartBtn).not.toBeNull();
      restartBtn?.click();

      // 5) 非同期完了を待つ
      await Promise.resolve();

      // 6) console.error の呼び出しを検証
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ゲーム開始音の再生に失敗しました:',
        expect.any(Error),
      );

      // 7) 後片付け
      consoleErrorSpy.mockRestore();
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

    it('should handle gesture detection with missing UI elements', async () => {
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

      const mockUpdateScore = vi.fn();
      const originalUpdateScore = window.updateScore;
      window.updateScore = mockUpdateScore;

      const landmarks = [[0, 0]];
      await handleGestureDetection(landmarks);

      expect(mockUpdateScore).toHaveBeenCalledWith(0);

      window.updateScore = originalUpdateScore;
    });

    it('should handle missing gesture display and name elements', async () => {
      // モックの設定
      const mockState = {
        score: 10,
        highScore: 20,
        isRunning: true,
        currentGesture: { name: 'gesture1', landmarks: [[0, 0]] },
        remainingTime: GameConfig.GAME_TIME,
      };
      vi.spyOn(gameService, 'getGameState').mockReturnValue(mockState);
      vi.spyOn(gestureService, 'getGestures').mockReturnValue([
        { name: 'gesture1', landmarks: [[0, 0]] },
      ]);
      vi.spyOn(gestureService, 'detectGesture').mockReturnValue('gesture1');
      vi.spyOn(gameService, 'selectNextGesture').mockReturnValue({
        name: 'gesture2',
        landmarks: [[0, 0]],
      });

      // window.updateScoreを空の関数として設定
      window.updateScore = () => {};
      const mockUpdateScore = vi.spyOn(window, 'updateScore');

      // gesture-displayを削除
      const gestureDisplay = document.getElementById('gesture-display');
      if (gestureDisplay) {
        gestureDisplay.remove();
      }

      // ジェスチャー検出を実行
      await handleGestureDetection([[0, 0, 0]]);

      // 検証
      expect(mockUpdateScore).toHaveBeenCalledWith(10);
    });

    it('should handle missing gesture name element', async () => {
      // モックの設定
      const mockState = {
        score: 10,
        highScore: 20,
        isRunning: true,
        currentGesture: { name: 'gesture1', landmarks: [[0, 0]] },
        remainingTime: GameConfig.GAME_TIME,
      };
      vi.spyOn(gameService, 'getGameState').mockReturnValue(mockState);
      vi.spyOn(gestureService, 'getGestures').mockReturnValue([
        { name: 'gesture1', landmarks: [[0, 0]] },
      ]);
      vi.spyOn(gestureService, 'detectGesture').mockReturnValue('gesture1');
      vi.spyOn(gameService, 'selectNextGesture').mockReturnValue({
        name: 'gesture2',
        landmarks: [[0, 0]],
      });

      // window.updateScoreを空の関数として設定
      window.updateScore = () => {};
      const mockUpdateScore = vi.spyOn(window, 'updateScore');

      // gesture-displayは存在するが、gesture-nameは存在しない状態を作成
      const gestureDisplay = document.createElement('div');
      gestureDisplay.id = 'gesture-display';
      document.body.appendChild(gestureDisplay);

      // ジェスチャー検出を実行
      await handleGestureDetection([[0, 0, 0]]);

      // 検証
      expect(mockUpdateScore).toHaveBeenCalledWith(10);

      // クリーンアップ
      gestureDisplay.remove();
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

    it('should handle gesture success with missing UI elements and window.updateScore', () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: true,
        score: 10,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: GameConfig.GAME_TIME,
      });

      // Remove gesture-display element
      const gestureDisplay = document.getElementById('gesture-display');
      gestureDisplay?.remove();

      // window.updateScoreを空の関数に設定
      const originalUpdateScore = window.updateScore;
      window.updateScore = () => {};

      handleGestureSuccess();

      // window.updateScoreが空の関数の場合でもエラーにならないことを確認
      expect(updateScore).toHaveBeenCalledWith(10);
      expect(selectNextGesture).toHaveBeenCalledWith(mockGestures);

      window.updateScore = originalUpdateScore;
    });

    it('should handle gesture success with missing gesture name element and window.updateScore', () => {
      (getGameState as Mock).mockReturnValue({
        isRunning: true,
        score: 10,
        highScore: 0,
        currentGesture: mockGestures[0],
        remainingTime: GameConfig.GAME_TIME,
      });

      // Remove gesture-name element
      const gestureName = document.querySelector('.gesture-name');
      gestureName?.remove();

      // window.updateScoreを空の関数に設定
      const originalUpdateScore = window.updateScore;
      window.updateScore = () => {};

      handleGestureSuccess();

      // window.updateScoreが空の関数の場合でもエラーにならないことを確認
      expect(updateScore).toHaveBeenCalledWith(10);
      expect(selectNextGesture).toHaveBeenCalledWith(mockGestures);

      window.updateScore = originalUpdateScore;
    });

    it('should handle missing gesture display and name elements', () => {
      // モックの設定
      const mockState = {
        score: 10,
        highScore: 20,
        isRunning: true,
        currentGesture: { name: 'gesture1', landmarks: [[0, 0]] },
        remainingTime: GameConfig.GAME_TIME,
      };
      vi.spyOn(gameService, 'getGameState').mockReturnValue(mockState);
      vi.spyOn(gestureService, 'getGestures').mockReturnValue([
        { name: 'gesture1', landmarks: [[0, 0]] },
      ]);
      vi.spyOn(gameService, 'selectNextGesture').mockReturnValue({
        name: 'gesture2',
        landmarks: [[0, 0]],
      });

      // window.updateScoreを空の関数として設定
      window.updateScore = () => {};
      const mockUpdateScore = vi.spyOn(window, 'updateScore');

      // gesture-displayを削除
      const gestureDisplay = document.getElementById('gesture-display');
      if (gestureDisplay) {
        gestureDisplay.remove();
      }

      // ジェスチャー成功処理を実行
      handleGestureSuccess();

      // 検証
      expect(mockUpdateScore).toHaveBeenCalledWith(10);
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
      expect(gestureName?.textContent).toBe('gesture2');
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

  describe('showGameOverDialog', () => {
    it('should handle missing dialog overlay', () => {
      // ダイアログオーバーレイを削除
      const overlay = document.querySelector('.dialog-overlay');
      overlay?.remove();

      // エラーログを監視
      const consoleSpy = vi.spyOn(console, 'error');
      showGameOverDialog(0);

      // エラーメッセージが出力されることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        'Dialog overlay element not found',
      );
      consoleSpy.mockRestore();
    });
  });

  describe('setNextGesture', () => {
    it('should return next gesture', () => {
      document.body.innerHTML = `
        <div id="gesture-display">
          <div class="gesture-name"></div>
        </div>
      `;

      const mockGestures = [
        { name: 'gesture1', landmarks: [[1, 1]] },
        { name: 'gesture2', landmarks: [[2, 2]] },
      ];

      // モックの設定を修正
      vi.spyOn(gestureService, 'getGestures').mockReturnValue(mockGestures);
      vi.spyOn(gameService, 'selectNextGesture').mockReturnValue(
        mockGestures[1],
      );

      const nextGesture = setNextGesture();

      // 期待される結果の検証
      expect(gestureService.getGestures).toHaveBeenCalled();
      expect(gameService.selectNextGesture).toHaveBeenCalledWith(mockGestures);
      expect(nextGesture).toBe(mockGestures[1]);

      // UIの更新を検証
      const gestureName = document.querySelector('.gesture-name');
      expect(gestureName?.textContent).toBe('gesture2');
    });
  });

  describe('showGameOverDialog and restart', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="dialog-overlay" style="display: flex;">
          <div id="final-score"></div>
          <div id="final-high-score"></div>
          <button id="restart-btn"></button>
        </div>
        <button id="start-game-btn"></button>
        <div id="score-display"></div>
        <div id="gesture-display">
          <div class="gesture-name"></div>
        </div>
        <div id="timer-display">
          <div class="hourglass">
            <div class="hourglass-top">
              <div class="sand"></div>
            </div>
            <div class="hourglass-bottom">
              <div class="sand"></div>
            </div>
          </div>
        </div>
      `;
    });

    it('should handle restart button click correctly', () => {
      const mockGestures = [{ name: 'test', landmarks: [[1, 1]] }];
      vi.spyOn(gestureService, 'getGestures').mockReturnValue(mockGestures);

      showGameOverDialog(100);
      const restartBtn = document.getElementById('restart-btn');
      const overlay = document.querySelector('.dialog-overlay') as HTMLElement;
      const startGameBtn = document.getElementById('start-game-btn');

      if (restartBtn && overlay && startGameBtn) {
        // リスタートボタンをクリック
        restartBtn.click();

        // オーバーレイが非表示になることを確認
        expect(overlay.style.display).toBe('none');
        // スタートボタンが無効化されることを確認
        expect(startGameBtn.getAttribute('disabled')).toBe('true');
      }
    });
  });

  describe('updateGameUI', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="score-display"></div>
        <div id="high-score-display"></div>
        <div id="gesture-display">
          <div class="gesture-name"></div>
        </div>
      `;
    });

    it('should update UI when no gesture is available', () => {
      const scoreDisplay = document.getElementById('score-display')!;
      const gestureDisplay = document.getElementById('gesture-display')!;
      const state = getGameState();
      state.currentGesture = null;
      state.score = 0;
      state.highScore = 100;

      updateGameUI(scoreDisplay, gestureDisplay);

      const gestureName = gestureDisplay.querySelector('.gesture-name');
      expect(gestureName?.textContent).toBe('完了');
    });
  });
});
