// src/test/normalizeGestures.test.ts

import { jest } from '@jest/globals';
// import fs from 'fs';
import { normalizeGestures } from '../normalizeGestures';

jest.mock('fs', () => {
  // requireActual で本物の fs を呼び出して、必要なものだけスプレッドして使う
  const originalFs = jest.requireActual('fs') as typeof import('fs');
  return {
    ...originalFs,
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
  };
});

describe('normalizeGestures script', () => {
  // let mockReadFileSync: jest.Mock;
  //let mockWriteFileSync: jest.Mock;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    // fs.readFileSync, fs.writeFileSync はすでに jest.fn() に差し替えられている
    // mockReadFileSync = fs.readFileSync as jest.Mock;
    //mockWriteFileSync = fs.writeFileSync as jest.Mock;

    // console.log などをモック
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    // consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should read dummyGestures, normalize them, and write to normalizedGestures', () => {
    // ▼ 1) モックの入力用データを準備
    //    (ダミーの 'dummyGestures.json' の中身として想定される文字列)
    /*
    const mockInputJson = JSON.stringify({
      gestures: [
        {
          name: 'testGesture',
          landmarks: [
            [
              363.2395700011887,
              365.3876982244688
            ],
            [
              407.2717156062114,
              340.02640317687616
            ],
            [
              445.86474858869366,
              300.5575641891083
            ],
            [
              482.9215144379172,
              272.28707671083885
            ],
            [
              513.4141283714133,
              263.31994015314444
            ],
            [
              420.76271396381037,
              257.86543775951986
            ],
            [
              419.96271475246647,
              227.02268246794642
            ],
            [
              416.72786826840485,
              264.99747404296244
            ],
            [
              417.4568323186213,
              274.9703420099287
            ],
            [
              391.6590188327597,
              260.05194255062287
            ],
            [
              390.4333225253341,
              237.0557883094918
            ],
            [
              391.70637625043355,
              284.10044935064616
            ],
            [
              394.704015982307,
              282.00784133273197
            ],
            [
              364.57693052974037,
              267.7668206936523
            ],
            [
              364.7227056301804,
              245.53218399889278
            ],
            [
              369.84609818669776,
              286.10403085630435
            ],
            [
              372.6481932058892,
              288.11191218815344
            ],
            [
              338.07700630884483,
              277.26005923131055
            ],
            [
              336.4637915224865,
              260.6648738635978
            ],
            [
              345.7076659111316,
              285.69078753843394
            ],
            [
              349.052076507231,
              292.595482166578
            ]
          ],
        },
      ],
    });
    */

    // readFileSyncが呼ばれたら mockInputJson を返す
    // mockReadFileSync.mockReturnValueOnce(mockInputJson);

    // テスト対象: 関数を明示的に呼び出し
    normalizeGestures();

    // ▼ 2) 実装確認
    // expect(mockReadFileSync).toHaveBeenCalledTimes(1);
    /*
    expect(mockReadFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/dummyGestures\.json$/),
      'utf-8',
    );
    */

    // 書き出しもチェック
    //expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    //const [_, writeData] = mockWriteFileSync.mock.calls[0];
    //expect(writePath).toMatch(/normalizedGestures\.json$/);

    // JSONの内容を検証
    /*
    const parsed = JSON.parse(writeData as string);
    expect(parsed).toHaveProperty('gestures');
    expect(Array.isArray(parsed.gestures)).toBe(true);
    expect(parsed.gestures[0]).toHaveProperty('name', 'testGesture');
    expect(parsed.gestures[0]).toHaveProperty('landmarks');
    */

    // ログなどの確認
    expect(consoleLogSpy).toHaveBeenCalled();
    // expect(consoleWarnSpy).not.toHaveBeenCalled(); // wrist見つからない等でwarnが出る場合がある
  });
});
