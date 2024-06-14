/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.(j|t)sx?$',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src'],
};
