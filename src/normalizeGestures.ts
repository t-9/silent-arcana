// src/normalizeGestures.ts
/**
 * ジェスチャーデータの正規化に関する機能を提供するモジュール
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { toRelativeLandmarks } from './logic'; // 正規化関数をインポート

/**
 * ジェスチャーの基本情報を表すインターフェース
 */
interface Gesture {
  /** ジェスチャーの名前 */
  name: string;
  /** ジェスチャーのランドマーク座標の配列（[x, y]の配列） */
  landmarks: [number, number][];
}

/**
 * 手のキーポイントの順序を定義する配列
 * logic.ts と同じ順序で定義されている
 */
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

/** ダミーのジェスチャーデータファイルのパス */
const dummyGesturesPath = resolve(
  __dirname,
  '../public/templates/dummyGestures.json',
);

/** 正規化されたジェスチャーデータファイルのパス */
const normalizedGesturesPath = resolve(
  __dirname,
  '../public/templates/normalizedGestures.json',
);

/**
 * 3次元空間上のキーポイントを表すインターフェース
 */
interface Keypoint {
  /** X座標 */
  x: number;
  /** Y座標 */
  y: number;
  /** Z座標 */
  z: number;
}

/**
 * キーポイントの配列を正規化する
 * @param {Keypoint[]} keypoints - 正規化するキーポイントの配列
 * @returns {number[][]} 手首を基準とした相対座標の配列
 */
export function normalizeKeypoints(keypoints: Keypoint[]): number[][] {
  if (!keypoints || keypoints.length === 0) {
    return [];
  }

  // 手首の位置を基準点として使用
  const wrist = keypoints[0];
  const baseX = wrist.x;
  const baseY = wrist.y;
  const baseZ = wrist.z;

  // 各キーポイントを相対座標に変換
  return keypoints.map((point) => [
    point.x - baseX,
    point.y - baseY,
    point.z - baseZ,
  ]);
}

/**
 * ジェスチャーデータを正規化してファイルに保存する
 * @param {string} [srcPath] - 入力ジェスチャーデータファイルのパス
 * @param {string} [dstPath] - 出力ジェスチャーデータファイルのパス
 */
export function normalizeGestures(
  srcPath: string = dummyGesturesPath,
  dstPath: string = normalizedGesturesPath,
): void {
  console.log('Dummy Gestures Path:', srcPath);
  console.log('Normalized Gestures Path:', dstPath);

  // ジェスチャーデータの読み込み
  const rawData = readFileSync(srcPath, 'utf-8');
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
    dstPath,
    JSON.stringify({ gestures: normalizedGestures }, null, 2),
  );
  console.log('ジェスチャーデータを正規化して保存しました。');
}
