module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: [
    'js',
    'ts',
  ],
  testMatch: [
    '**/__tests__/**/*.test.ts',
  ],
  transform: {
    '^.+.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
      },
    ],
  },
}