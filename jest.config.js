// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js"
  ],
  collectCoverage: false,
  collectCoverageFrom: [
    "src/**/*.{ts,js}",
    "!src/**/index.{ts,js}",        // 除外したいものがあれば
    "!src/test/**"                  // テストファイルは除外
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"], // 画面表示＋lcovなど
};
