import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getGameState,
  startGame,
  stopGame,
  updateScore,
  selectNextGesture,
  resetState,
} from '../gameService';
import { GameConfig } from '../config';
import type { Gesture } from '../gestureService';

// getGesturesのモック
vi.mock('../gestureService', () => ({
  getGestures: vi.fn(() => [
    {
      name: 'あ',
      landmarks: [
        [0, 0],
        [0.2932064264605356, -0.16887877229556802],
        [0.5501942505055316, -0.43169851630617156],
        [0.7969521983988606, -0.6199493610902418],
        [1, -0.6796607839504827],
        [0.38304187198480133, -0.71598186558255],
        [0.37771474320862297, -0.9213612296126206],
        [0.35617416723378464, -0.6684902241164902],
        [0.36102827872994997, -0.6020817187398325],
        [0.1892427661515653, -0.7014221104893296],
        [0.18108095551780998, -0.8545516051966738],
        [0.18955811529051247, -0.5412850868748726],
        [0.20951915106385152, -0.5552195910986526],
        [0.00890537347381208, -0.6500493731444994],
        [0.009876077846257667, -0.7981079853093147],
        [0.04399232637809391, -0.527943402854609],
        [0.0626512460353333, -0.5145730866463263],
        [-0.16755543658940386, -0.5868346805848274],
        [-0.17829770081755164, -0.6973406514217831],
        [-0.11674350356227334, -0.5306951560300812],
        [-0.09447334920061076, -0.48471736389886044],
      ],
    },
    {
      name: 'い',
      landmarks: [
        [0, 0],
        [0.17145971993299536, -0.003975762869009893],
        [0.3238982994836346, -0.09346072314491315],
        [0.39574259415291463, -0.23084673226216734],
        [0.3759749541474336, -0.36718313344410636],
        [0.3798273970174374, -0.39137913119292794],
        [0.4067017358951185, -0.4941181806317243],
        [0.32080416228015973, -0.3499042452456467],
        [0.24545095220590843, -0.21236920789524627],
        [0.25768708184693134, -0.45977419007392667],
        [0.2808724654274662, -0.5446404804796626],
        [0.19395811419086248, -0.33742654622391965],
        [0.14300887179838762, -0.19899021348783463],
        [0.13285713256098153, -0.5056774688624962],
        [0.16838922890622549, -0.6337691715808994],
        [0.12435286640513035, -0.44527119604517224],
        [0.0947039277151663, -0.2832798421838298],
        [0.01267629326968219, -0.529540710182762],
        [0.02109615467228154, -0.7397707966906883],
        [0.020118993481269113, -0.877724872977939],
        [0.03197733075273061, -1],
      ],
    },
    {
      name: 'う',
      landmarks: [
        [0, 0],
        [0.13410240385609373, -0.009065635439033961],
        [0.2256681184026416, -0.15397477576916446],
        [0.17666396205091972, -0.29492293720456497],
        [0.0708707191278458, -0.3938907447323821],
        [0.21005905577781409, -0.4461916628222434],
        [0.2113618160919624, -0.6686922463079734],
        [0.19461727805250492, -0.8246867554238533],
        [0.18144489080203288, -0.955113191667025],
        [0.0894886036180009, -0.46600177016620065],
        [0.08693966133523241, -0.6974894810625927],
        [0.0799433887006108, -0.860565154051795],
        [0.0846818477809918, -1],
        [-0.02760579760864982, -0.43024856390341454],
        [-0.03964367322120505, -0.5707149201059669],
        [-0.027554965300186335, -0.4041029655573737],
        [-0.01058062674921102, -0.2791276183701856],
        [-0.14330758757937886, -0.3500845238757824],
        [-0.14449544464646866, -0.4332436789276469],
        [-0.10211819558310287, -0.310384824577434],
        [-0.0701101034981354, -0.21083947138894762],
      ],
    },
    {
      name: 'え',
      landmarks: [
        [0, 0],
        [0.22899222583997728, -0.12584866019907265],
        [0.3663081458430294, -0.3743833041540586],
        [0.3996530692678239, -0.5912196117518685],
        [0.3618004431710394, -0.7285632983752217],
        [0.2063674316165264, -0.6917079340016096],
        [0.2133338599795436, -0.9382617812351967],
        [0.24826454759703795, -0.951274337794361],
        [0.24849999222686653, -0.8427299978763998],
        [0.06506384381716715, -0.7132380305493933],
        [0.05465417518224964, -1],
        [0.10064377623071921, -0.9952228481600024],
        [0.11858714929122394, -0.8613979452357815],
        [-0.06478493530042487, -0.6797301381957651],
        [-0.10454462684622601, -0.9582998970904624],
        [-0.05601262290035737, -0.96161832757959],
        [-0.01601241956318168, -0.8503837271422654],
        [-0.20421146752183755, -0.5962966717265974],
        [-0.2792498739113271, -0.783551257418751],
        [-0.24975771831090932, -0.8324258129650326],
        [-0.2007401865730276, -0.7976630052008298],
      ],
    },
    {
      name: 'お',
      landmarks: [
        [0, 0],
        [-0.0197587919738974, -0.3678389382561037],
        [0.20430505169673438, -0.6612438895812012],
        [0.532834307155842, -0.6943548600778173],
        [0.7819552585929864, -0.5827752935780203],
        [0.45315430578591176, -0.7086909791026778],
        [0.6834557796938084, -0.6142765764991458],
        [0.7827624398059556, -0.41106175768792613],
        [0.8644023201229403, -0.2222720816803042],
        [0.5610089949227827, -0.5540972579793684],
        [0.8241334163597128, -0.4545321710820052],
        [0.9140152834462121, -0.2546440368289132],
        [0.9562203041501818, -0.05783412613168519],
        [0.6101922494207694, -0.40373657537791535],
        [0.8749479047873208, -0.32712767832965106],
        [0.9463291055743216, -0.18804696547746394],
        [0.9518457883385251, -0.01337086566037347],
        [0.6231289503559952, -0.24155148454601766],
        [0.832696081008372, -0.2031742357605935],
        [0.9358864888393279, -0.13125156742296504],
        [1, -0.030992732197387955],
      ],
    },
  ]),
}));

describe('gameService', () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
  };

  beforeEach(() => {
    // LocalStorageのモック
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // コンソール出力のモック
    console.log = vi.fn();
    console.error = vi.fn();

    // モックをリセット
    vi.clearAllMocks();

    // 各テスト前に状態をリセット
    resetState(0);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getGameState', () => {
    it('should return current game state', () => {
      const state = getGameState();
      expect(state).toEqual({
        score: 0,
        highScore: 0,
        currentGesture: null,
        remainingTime: GameConfig.GAME_TIME,
        isRunning: false,
      });
    });
  });

  describe('startGame', () => {
    it('should initialize game state with gestures', () => {
      const mockGestures: Gesture[] = [
        { name: 'test1', landmarks: [[0, 0]] },
        { name: 'test2', landmarks: [[1, 1]] },
      ];

      startGame(mockGestures);

      const state = getGameState();
      expect(state.isRunning).toBe(true);
      expect(state.score).toBe(0);
      expect(state.remainingTime).toBe(GameConfig.GAME_TIME);
      expect(state.currentGesture).toBeTruthy();
      expect(mockGestures).toContainEqual(state.currentGesture);
    });

    it('should handle empty gestures array', () => {
      startGame([]);

      const state = getGameState();
      expect(state.isRunning).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'ジェスチャーデータが読み込まれていません',
      );
    });

    it('should handle undefined gestures', () => {
      // @ts-expect-error: テストのために意図的にundefinedを渡す
      startGame(undefined);

      const state = getGameState();
      expect(state.isRunning).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'ジェスチャーデータが読み込まれていません',
      );
    });
  });

  describe('stopGame', () => {
    it('should stop game and update high score if current score is higher', () => {
      // ゲームを開始して得点を追加
      startGame([{ name: 'test', landmarks: [[0, 0]] }]);
      updateScore(150);

      stopGame();

      const state = getGameState();
      expect(state.isRunning).toBe(false);
      expect(state.highScore).toBe(150);
      expect(localStorage.setItem).toHaveBeenCalledWith('highScore', '150');
    });

    it('should not update high score if current score is lower', () => {
      // 初期ハイスコアを設定
      localStorageMock.getItem.mockReturnValue('200');
      resetState();

      // ゲームを開始して低い得点を追加
      startGame([{ name: 'test', landmarks: [[0, 0]] }]);
      updateScore(100);

      stopGame();

      const state = getGameState();
      expect(state.isRunning).toBe(false);
      expect(state.highScore).toBe(200);
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('updateScore', () => {
    it('should add points to current score', () => {
      updateScore(100);
      expect(getGameState().score).toBe(100);

      updateScore(50);
      expect(getGameState().score).toBe(150);
    });
  });

  describe('selectNextGesture', () => {
    it('should select random gesture from array', () => {
      const mockGestures = [
        { name: 'test1', landmarks: [[0, 0]] },
        { name: 'test2', landmarks: [[1, 1]] },
      ];

      const gesture = selectNextGesture(mockGestures);

      expect(gesture).toBeTruthy();
      expect(mockGestures).toContainEqual(gesture);
      expect(getGameState().currentGesture).toBe(gesture);
    });

    it('should handle empty gestures array', () => {
      const gesture = selectNextGesture([]);
      expect(gesture).toBeUndefined();
      expect(getGameState().currentGesture).toBeUndefined();
    });
  });

  describe('resetState', () => {
    it('should reset state with provided high score', () => {
      resetState(500);

      const state = getGameState();
      expect(state).toEqual({
        score: 0,
        highScore: 500,
        currentGesture: null,
        remainingTime: GameConfig.GAME_TIME,
        isRunning: false,
      });
    });

    it('should use localStorage high score if not provided', () => {
      localStorageMock.getItem.mockReturnValue('300');

      resetState();

      const state = getGameState();
      expect(state.highScore).toBe(300);
    });

    it('should use default high score if localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      resetState();

      const state = getGameState();
      expect(state.highScore).toBe(100);
    });
  });
});
