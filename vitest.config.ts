import { defineConfig } from 'vitest/config';

/* istanbul ignore file */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        '**/node_modules/**',
        '**/*.test.ts',
        'webpack.config.js',
        'vitest.config.ts',
        'eslint.config.js',
        'release.config.js',
        '*.config.{js,ts}',
        '**/node_modules/@mediapipe/**',
        'public/**'  // publicディレクトリも除外
      ],
      include: [
        'src/**/*.{js,jsx,ts,tsx}'  // srcディレクトリのみを含める
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    onConsoleLog: (log, type) => {
      if (type === 'error' && (
        log.includes('カメラの起動がタイムアウトしました') ||
        log.includes('DOM要素が見つからない')
      )) {
        return false;
      }
    },
    onUnhandledRejection: (error) => {
      if (error.message && (
        error.message.includes('カメラの起動がタイムアウトしました') ||
        error.message.includes('DOM要素が見つからない')
      )) {
        return false;
      }
      return true;
    },
  },
}); 