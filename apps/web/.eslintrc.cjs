module.exports = {
  root: false,
  extends: ['../../.eslintrc.cjs', 'next/core-web-vitals'],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
  },
};
