/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/?(*.)+(spec|test).(ts|tsx)'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
        useESM: true
      }
    ],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/test-utils/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/test-utils/fileMock.js',
    '^react-konva$': '<rootDir>/src/test-utils/reactKonvaMock.js'
  },
  // Performance optimizations
  maxWorkers: '50%', // Use half of available CPU cores
  workerIdleMemoryLimit: '512MB', // Limit memory per worker
  testTimeout: 10000, // 10 second timeout per test
  // Coverage configuration
  collectCoverage: false, // Only collect when explicitly requested
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Memory management
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Test isolation
  testSequencer: '@jest/test-sequencer',
  // Verbose output for debugging
  verbose: false,
}


