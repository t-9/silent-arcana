// src/cameraModule.ts

/**
 * 依存注入用の getUserMedia 関数。
 * 本番では navigator.mediaDevices.getUserMedia を使うが、テスト時には差し替え可能。
 */
let _getUserMedia = async (
  constraints: MediaStreamConstraints,
): Promise<MediaStream> => {
  // constraints が未定義の場合や video が未設定の場合にデフォルト値を適用
  const defaultConstraints: MediaStreamConstraints = {
    video: {
      width: { ideal: 960 },
      height: { ideal: 600 },
    },
  };

  // constraints をマージしてデフォルトを上書き
  const mergedConstraints: MediaStreamConstraints = {
    ...defaultConstraints,
    video: {
      ...(defaultConstraints.video as MediaTrackConstraints),
      ...(constraints.video as MediaTrackConstraints),
    },
  };

  return navigator.mediaDevices.getUserMedia(mergedConstraints);
};

/**
 * getter: 外部から現在の getUserMedia 関数を取得
 */
export function getGetUserMedia() {
  return _getUserMedia;
}

/**
 * setter: テスト時などにモック版 getUserMedia を差し替える
 */
export function setGetUserMedia(fn: typeof _getUserMedia) {
  _getUserMedia = fn;
}
