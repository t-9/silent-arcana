// src/cameraService.ts
import { getGetUserMedia } from './cameraModule';

export async function startCamera(videoEl: HTMLVideoElement, setLoading: (text: string) => void) {
  setLoading('カメラを起動しています...');
  try {
    const stream = await getGetUserMedia()({ video: true });
    console.log('Stream obtained:', stream);

    // videoElがない場合は呼び出し元で制御するほうが安全
    videoEl.srcObject = stream;
    await new Promise<void>((resolve) => {
      videoEl.onloadedmetadata = () => {
        console.log('onloadedmetadata event fired');
        resolve();
      };
    });

    console.log('カメラ開始');
    setLoading('');
  } catch (err) {
    console.error('カメラ使用許可が必要です:', err);
    setLoading('カメラの起動に失敗しました');
  }
}
