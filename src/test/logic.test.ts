// src/test/logic.test.ts
import { jest } from '@jest/globals';
import {
  Hand,
  HandDetector,
  HandDetectorInput,
  MediaPipeHandsMediaPipeEstimationConfig,
  MediaPipeHandsTfjsEstimationConfig,
} from '@tensorflow-models/hand-pose-detection';
import { handsToMessage, detectHandsOnce } from '../logic';

type EstimateHandsFn = (
  input: HandDetectorInput,
  estimationConfig?:
    | MediaPipeHandsMediaPipeEstimationConfig
    | MediaPipeHandsTfjsEstimationConfig
) => Promise<Hand[]>;

describe('handsToMessage', () => {
  it('returns "手が検出されていません" if no hands', () => {
    expect(handsToMessage([])).toBe('手が検出されていません');
  });

  it('returns keypoints info if hands exist', () => {
    const mockHands: Hand[] = [
      {
        keypoints: [
          // x が undefined
          { name: 'thumb', x: undefined as unknown as number, y: 234.567 },
          // y が undefined
          { name: 'index', x: 50, y: undefined as unknown as number },
          // 両方とも定義されている別キー
          { name: 'middle', x: 12.3456, y: 78.9123 },
        ],
        handedness: 'Left',
        score: 0.9,
      },
    ];
    const result = handsToMessage(mockHands);
    expect(result).toMatch(/thumb: \(0\.00, 234\.57\)/);
    expect(result).toMatch(/index: \(50\.00, 0\.00\)/);
    expect(result).toMatch(/middle: \(12\.35, 78\.91\)/);
  });
});

describe('detectHandsOnce', () => {
  it('calls detector.estimateHands and returns the correct message', async () => {
    // `jest.fn()` にジェネリクスを直接与えるのではなく、
    // "as jest.MockedFunction<...>" で型を後付けする
    const mockEstimateHands = jest.fn() as jest.MockedFunction<EstimateHandsFn>;

    // 返すダミー Hand[]
    mockEstimateHands.mockResolvedValue([
      {
        keypoints: [
          { name: 'index', x: 100, y: 200 },
          { name: undefined, x: 50, y: 60 },
        ],
        handedness: 'Right',
        score: 0.8,
      },
    ]);

    const mockDetector: HandDetector = {
      estimateHands: mockEstimateHands,
      dispose: jest.fn(),
      reset: jest.fn(),
    };

    const mockVideo = {} as HTMLVideoElement;
    const message = await detectHandsOnce(mockDetector, mockVideo);

    // check
    expect(mockEstimateHands).toHaveBeenCalledWith(mockVideo);
    expect(message).toMatch(/index: \(100\.00, 200\.00\)/);
    expect(message).toMatch(/point: \(50\.00, 60\.00\)/);
  });

  it('returns "手が検出されていません" if no hands are detected', async () => {
    const mockEstimateHands = jest.fn() as jest.MockedFunction<EstimateHandsFn>;
    mockEstimateHands.mockResolvedValue([]); // 空配列

    const mockDetector: HandDetector = {
      estimateHands: mockEstimateHands,
      dispose: jest.fn(),
      reset: jest.fn(),
    };
    const mockVideo = {} as HTMLVideoElement;

    const message = await detectHandsOnce(mockDetector, mockVideo);

    expect(mockEstimateHands).toHaveBeenCalled();
    expect(message).toBe('手が検出されていません');
  });
});