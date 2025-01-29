// src/cameraService.ts
import { getGetUserMedia } from './cameraModule';

/**
 * カメラの起動と管理を行うモジュール
 */

/**
 * カメラを起動し、ビデオ要素にストリームを設定する
 * @param {HTMLVideoElement} videoEl - カメラ映像を表示するビデオ要素
 * @param {function} setLoading - ローディング状態を更新するコールバック関数
 * @returns {Promise<void>} カメラの起動が完了したことを示すPromise
 * @throws {Error} カメラの起動に失敗した場合、タイムアウトした場合、またはビデオ解像度が不正な場合
 */
export async function startCamera(
  videoEl: HTMLVideoElement,
  setLoading: (text: string | boolean) => void,
): Promise<void> {
  const messageEl = document.getElementById('message');
  setLoading(true);
  if (messageEl) {
    messageEl.textContent = 'カメラを起動しています...';
    messageEl.setAttribute('data-text', 'カメラを起動しています...');
  }

  try {
    const stream = await getGetUserMedia()({ video: true });
    videoEl.srcObject = stream;

    // メタデータが読み込まれるのを待つ
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('カメラの起動がタイムアウトしました'));
      }, 5000);

      videoEl.onloadedmetadata = () => {
        clearTimeout(timeout);
        if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
          reject(new Error('カメラのビデオ解像度が不正です'));
        } else {
          console.log(
            `ビデオ解像度: ${videoEl.videoWidth}x${videoEl.videoHeight}`,
          );
          resolve();
        }
      };

      videoEl.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('ビデオの読み込みに失敗しました'));
      };
    });

    // ビデオ再生
    await videoEl.play();
    setLoading(false);
    if (messageEl) {
      messageEl.textContent = '';
      messageEl.setAttribute('data-text', '');
    }
  } catch (err) {
    console.error('カメラの起動に失敗しました:', err);
    setLoading(false);
    if (messageEl) {
      messageEl.textContent = 'カメラの起動に失敗しました';
      messageEl.setAttribute('data-text', 'カメラの起動に失敗しました');
    }
    if (
      err instanceof Error &&
      err.message === 'カメラの起動がタイムアウトしました'
    ) {
      throw err;
    }
    throw new Error('カメラ使用許可が必要です');
  }
}
