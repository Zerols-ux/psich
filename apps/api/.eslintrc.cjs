module.exports = {
  root: false,
  extends: ['../../.eslintrc.cjs'],
  env: { node: true, browser: false },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
