/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  verbose: true,
  testTimeout: 10000,
  setupFiles: ['<rootDir>/test/setup-env.js'],
  setupFilesAfterEnv: ['<rootDir>/test/test-helper.ts'],
};
