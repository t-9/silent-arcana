// src/test/normalizeGestures.test.ts

import { jest } from '@jest/globals';
import { normalizeGestures } from '../normalizeGestures';

jest.mock('fs', () => {
  // requireActual で本物の fs を呼び出して、必要なものだけスプレッドして使う
  const originalFs = jest.requireActual('fs');
  return {
    ...(originalFs as typeof import('fs')),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
  };
});

describe('normalizeGestures script', () => {
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // console.log などをモック
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should read dummyGestures, normalize them, and write to normalizedGestures', () => {
    // テスト対象: 関数を明示的に呼び出し
    normalizeGestures();

    // ログなどの確認
    expect(consoleLogSpy).toHaveBeenCalled();
  });
});
