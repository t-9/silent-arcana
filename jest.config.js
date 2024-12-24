// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // Jestがテスト対象とする拡張子
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "mjs", "cjs"],

  // 「ESM を扱う際にどの拡張子をトランスフォーム対象とするか」
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",   // あなたの tsconfig
        useESM: true                // ESM トランスパイルを有効にする
      }
    ]
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js"
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,js,tsx}",
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/jest.setup.js',
    '!webpack.config.js',
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"],
  setupFiles: ["<rootDir>/jest.setup.js"],
};
