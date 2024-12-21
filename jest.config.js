// jest.config.js
export default {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js"
  ]
};
