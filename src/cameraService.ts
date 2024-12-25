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

    // メタデータ(解像度など)が読み込まれるまで待つ
    await new Promise<void>((resolve, reject) => {
      videoEl.onloadedmetadata = () => {
        console.log('onloadedmetadata event fired');
        // 再生開始
        videoEl
          .play()
          .then(() => {
            console.log('video started playing');
            resolve();
          })
          .catch(reject);
      };
    });

    setLoading('');
  } catch (err) {
    console.error('カメラ使用許可が必要です:', err);
    setLoading('カメラの起動に失敗しました');
  }
}
