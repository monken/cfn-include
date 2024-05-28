const prettier = require('./.prettierrc');

module.exports = {
  extends: ['eslint-config-standard', 'plugin:prettier/recommended'],
  rules: {
    'max-len': ['error', { code: prettier.printWidth, ignoreUrls: true }], // KEEP THIS IN SYNC
    strict: 0,
    'arrow-parens': ['error', 'always'],
    'consistent-return': 0,
    'no-param-reassign': 0,
    'func-names': 0,
    'no-use-before-define': 0,
    'one-var': 0,
    'prefer-destructuring': 0,
    'no-template-curly-in-string': 0,
    'prefer-template': 0,
    'prefer-const': 0,
    'promise/avoid-new': 0,
    'promise/always-return': 0,
    'promise/no-nesting': 0,
    'promise/no-return-wrap': 0,
    'promise/no-callback-in-promise': 0,
    'promise/no-promise-in-callback': 0,
    semi: ['error', 'always'],
    // 'comma-dangle': ['error', 'always-multiline'],
  },
  overrides: [
    {
      files: ['t/**/*.js'],
      plugins: ['mocha'],
      env: {
        mocha: true,
        node: true,
      },
      rules: {
        'mocha/valid-suite-description': 0,
        'mocha/valid-test-description': 0,
      },
    },
  ],
};
