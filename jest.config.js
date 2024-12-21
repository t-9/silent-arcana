// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js"
  ]
};
