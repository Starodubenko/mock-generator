const { jestMapper } = require('../../scripts/layer-aliases.cjs');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  rootDir: '..',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/test/jest-e2e.setup.ts'],
  moduleNameMapper: jestMapper('<rootDir>'),
};
