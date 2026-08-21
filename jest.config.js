module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/legacy-ios/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/features/pushups/domain/**/*.{ts,tsx}',
    'src/lib/haptics.ts',
  ],
};
