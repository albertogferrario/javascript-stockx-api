module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    'jest/globals': true,
  },
  extends: 'airbnb-base',
  overrides: [
    {
      files: ['test/**'],
      plugins: ['jest'],
      extends: ['plugin:jest/recommended'],
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'jest',
  ],
  rules: {
    // Allow snake_case for OAuth2 token fields to match API responses
    'camelcase': ['error', { 
      allow: ['access_token', 'token_type', 'expires_in', 'refresh_token', 'grant_type', 'client_id', 'client_secret', 'response_type', 'redirect_uri'] 
    }],
    // Allow multiple classes per file for storage interfaces
    'max-classes-per-file': ['error', { ignoreExpressions: true, max: 2 }],
    // Allow unused parameters in interface classes
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // Allow require() in function scope for lazy loading
    'global-require': 'off',
    // Allow class methods that don't use this (for interfaces)
    'class-methods-use-this': ['error', { exceptMethods: ['get', 'set', 'delete', 'clear'] }],
  },
};