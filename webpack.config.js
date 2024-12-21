// webpack.config.js (ES Modules形式)

import path from 'path';
import { fileURLToPath } from 'url';

// __filename, __dirname の代わり
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('webpack').Configuration} */
export default {
  mode: 'development',
  entry: './src/app.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  resolve: {
    // .ts, .js を解決
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  // Webpack が生成する最終バンドルの互換性をどうするかは "target" などで調整
  // 例: target: ['web', 'es2022'] (Webpack5で対応)
  target: ['web', 'es2022'] // ES2022 文法で出力を許可 (要Webpack5+)
};
