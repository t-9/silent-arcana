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
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,js,tsx}",
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/jest.setup.js',
    '!webpack.config.js',
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "clover"]
};
