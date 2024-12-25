// webpack.config.js (ES Modules形式)
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('webpack').Configuration} */
export default {
  // "production" or "development" を環境変数から切り替え
  mode: isProduction ? 'production' : 'development',

  // ソースマップ (開発時は "inline-source-map" などにしてもOK)
  devtool: isProduction ? 'source-map' : 'inline-source-map',

  // エントリーポイント
  entry: './src/app.ts',

  // 出力先設定
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },

  resolve: {
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

  // Webpackが生成する最終バンドルの互換性
  target: ['web', 'es2022'],

  // 開発用サーバ設定
  devServer: {
    // public フォルダを静的配信する
    static: {
      directory: path.join(__dirname, 'public'),
    },
    port: 8080,   // 任意のポート
    open: true,   // 起動時にブラウザを自動で開く
    hot: true,    // ホットリロードを有効に (デフォルトでtrueになることも)
  },
};
