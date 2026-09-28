// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

const structureConfigs = require('./eslint.structure');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'android/*', 'ios/*', 'expo-env.d.ts'],
  },
  {
    // Ap dung cho moi file
    rules: {
      // Sap xep import: thu vien ngoai -> @/ -> tuong doi
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [{ pattern: '@/**', group: 'internal', position: 'before' }],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      // axios export mac dinh la object co ca named export -> canh bao sai
      'import/no-named-as-default-member': 'off',
      // Dung logger trong @/lib/logger thay cho console
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Rule can plugin @typescript-eslint chi ap cho file TypeScript
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // Cau truc thu muc va luat phu thuoc giua cac tang (xem eslint.structure.js)
  ...structureConfigs,
]);
