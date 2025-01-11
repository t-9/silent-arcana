// src/cameraService.ts
import { getGetUserMedia } from './cameraModule';

export async function startCamera(
  videoEl: HTMLVideoElement,
  setLoading: (text: string) => void,
) {
  setLoading('カメラを起動しています...');
  try {
    const stream = await getGetUserMedia()({ video: true });
    videoEl.srcObject = stream;

    // メタデータが読み込まれるのを待つ
    await new Promise<void>((resolve, reject) => {
      videoEl.onloadedmetadata = () => {
        console.log('onloadedmetadata event fired');
        if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) {
          reject(new Error('カメラのビデオ解像度が不正です'));
        } else {
          console.log(`ビデオ解像度: ${videoEl.videoWidth}x${videoEl.videoHeight}`);
          resolve();
        }
      };
      videoEl.onerror = () => reject(new Error('ビデオの読み込みに失敗しました'));
    });

    // ビデオ再生
    await videoEl.play();
    setLoading('');
  } catch (err) {
    console.error('カメラ使用許可が必要です:', err);
    setLoading('カメラの起動に失敗しました');
  }
}
