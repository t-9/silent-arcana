// src/cameraModule.ts

/**
 * カメラのメディアストリーム取得機能を管理するモジュール
 * 依存性注入パターンを使用してテスト可能な設計を提供
 */

/**
 * メディアストリームを取得する関数
 * @param {MediaStreamConstraints} constraints - メディアストリームの制約条件
 * @returns {Promise<MediaStream>} 取得したメディアストリーム
 * @private
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
 * 現在のメディアストリーム取得関数を返す
 * @returns {function} メディアストリーム取得関数
 */
export function getGetUserMedia() {
  return _getUserMedia;
}

/**
 * メディアストリーム取得関数を設定する（主にテスト用）
 * @param {function} fn - 設定するメディアストリーム取得関数
 */
export function setGetUserMedia(fn: typeof _getUserMedia) {
  _getUserMedia = fn;
}
