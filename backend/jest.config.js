const { createDefaultPreset } = require('ts-jest');

/** @type {import('jest').Config} */
module.exports = {
  ...createDefaultPreset(),
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/helpers/load-test-env.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup-after-env.ts'],
  globalSetup: '<rootDir>/tests/helpers/global-setup.ts',
  globalTeardown: '<rootDir>/tests/helpers/global-teardown.ts',
  maxWorkers: 1,
  // O cliente Prisma gerado usa imports relativos com extensão .js (padrão NodeNext),
  // mas só existe o .ts fonte (ts-jest não compila pra .js em disco) — sem isso, require()
  // procura um arquivo .js que nunca existiu.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
