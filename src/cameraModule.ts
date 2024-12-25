// src/cameraModule.ts

/**
 * 依存注入用の getUserMedia 関数。
 * 本番では navigator.mediaDevices.getUserMedia を使うが、テスト時には差し替え可能。
 */
let _getUserMedia = async (
  constraints: MediaStreamConstraints,
): Promise<MediaStream> => {
  return navigator.mediaDevices.getUserMedia(constraints);
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
