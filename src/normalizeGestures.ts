// src/normalizeGestures.ts
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { toRelativeLandmarks } from './logic'; // 正規化関数をインポート

interface Gesture {
  name: string;
  landmarks: [number, number][];
}

// logic.ts と同じ順序でキーポイント名を定義
const KEYPOINT_ORDER = [
  'wrist',
  'thumb_cmc',
  'thumb_mcp',
  'thumb_ip',
  'thumb_tip',
  'index_finger_mcp',
  'index_finger_pip',
  'index_finger_dip',
  'index_finger_tip',
  'middle_finger_mcp',
  'middle_finger_pip',
  'middle_finger_dip',
  'middle_finger_tip',
  'ring_finger_mcp',
  'ring_finger_pip',
  'ring_finger_dip',
  'ring_finger_tip',
  'pinky_finger_mcp',
  'pinky_finger_pip',
  'pinky_finger_dip',
  'pinky_finger_tip',
];

// __dirname の代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// パスの解決
const dummyGesturesPath = resolve(
  __dirname,
  '../public/templates/dummyGestures.json',
);
const normalizedGesturesPath = resolve(
  __dirname,
  '../public/templates/normalizedGestures.json',
);

export function normalizeGestures(): void {
  console.log('Dummy Gestures Path:', dummyGesturesPath);
  console.log('Normalized Gestures Path:', normalizedGesturesPath);

  // ジェスチャーデータの読み込み
  const rawData = readFileSync(dummyGesturesPath, 'utf-8');
  const data = JSON.parse(rawData);
  const gestures: Gesture[] = data.gestures;

  // 正規化処理
  const normalizedGestures = gestures.map((gesture) => {
    // ランドマークに名前を割り当てる
    const keypoints = gesture.landmarks.map(([x, y], index) => ({
      x,
      y,
      name: KEYPOINT_ORDER[index] || `point_${index}`,
    }));

    // 正規化
    const normalized = toRelativeLandmarks(keypoints);

    // 'wrist' が見つかったかどうかを確認
    const hasWrist = keypoints.some((pt) => pt.name === 'wrist');
    console.log(`Gesture "${gesture.name}": wrist found = ${hasWrist}`);

    if (!hasWrist) {
      console.warn(`Gesture "${gesture.name}" does not have a wrist keypoint.`);
    }

    return {
      name: gesture.name,
      landmarks: normalized as [number, number][],
    };
  });

  // 正規化されたデータを保存
  writeFileSync(
    normalizedGesturesPath,
    JSON.stringify({ gestures: normalizedGestures }, null, 2),
  );
  console.log('ジェスチャーデータを正規化して保存しました。');
}

normalizeGestures();
