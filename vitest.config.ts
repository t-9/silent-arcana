import { defineConfig } from 'vitest/config';

/* istanbul ignore file */
export default defineConfig({
  test: {
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
    }
  },
}); 