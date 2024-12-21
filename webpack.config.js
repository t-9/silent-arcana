// webpack.config.js (ES Modules形式)

import path from 'path';
import { fileURLToPath } from 'url';

// __filename, __dirname の代わり
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// export default で設定を返す
export default {
  mode: 'development',   // "production" にすると最適化
  entry: './src/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'),
  },
  // 必要に応じてローダーやプラグイン追加
};
