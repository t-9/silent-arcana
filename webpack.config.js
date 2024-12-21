// webpack.config.js
const path = require('path');

module.exports = {
  mode: 'development',   // 開発モード ("production"にすると最適化される)
  entry: './src/app.js', // エントリポイント: src/app.js
  output: {
    filename: 'bundle.js',             // 出力ファイル名
    path: path.resolve(__dirname, 'public'), // 出力先ディレクトリ
  },
  // モジュールやプラグインの追加設定は必要に応じて追記
};
