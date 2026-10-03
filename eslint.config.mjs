// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'apps/test-indexer/**', 'dist/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
  {
    files: [
      'src/infra/local-data/in-memory-process.store.ts',
      'src/infra/local-data/local-opensearch-index.adapter.ts',
      'src/use-cases/commands/start-training/start-training.handler.spec.ts',
    ],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    files: ['src/frontend/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@app',
                '@app/*',
                '@api',
                '@api/*',
                '@use-cases',
                '@use-cases/*',
                '@entities',
                '@entities/*',
                '@repositories',
                '@repositories/*',
                '@infra',
                '@infra/*',
                '@test',
                '@test/*',
              ],
              message:
                'Frontend slices use @frontend/* only. Do not import backend layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/entities/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@app',
                '@app/*',
                '@api',
                '@api/*',
                '@use-cases',
                '@use-cases/*',
                '@repositories',
                '@repositories/*',
                '@infra',
                '@infra/*',
                '@frontend',
                '@frontend/*',
                '@views',
                '@views/*',
                '@test',
                '@test/*',
              ],
              message: 'entities must not import other layers.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/use-cases/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@infra',
                '@infra/*',
                '@api',
                '@api/*',
                '@frontend',
                '@frontend/*',
                '@views',
                '@views/*',
              ],
              message:
                'use-cases may import @entities and @repositories only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/views/entry-client.tsx', 'src/views/entry-server.tsx'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);