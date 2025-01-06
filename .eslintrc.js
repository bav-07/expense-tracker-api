module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
      'airbnb-typescript/base',
  ],
  parserOptions: {
      project: './tsconfig.json',
  },
  rules: {
      'unused-imports/no-unused-imports': 'warn',
  },
  plugins: ['unused-imports'],
};
