import css from '@eslint/css';
import globals from 'globals';
import js from '@eslint/js';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import r4fConfig from 'riot-4-fun/eslint/config.mjs';
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  r4fConfig,
  globalIgnores ([ '**/*.riot.*.mjs', 'package-lock.json' ]),
  {
    files: [ '**/*.{js,mjs,cjs}' ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    extends: [ 'json/recommended' ],
    files: [ '**/*.json' ],
    language: 'json/json',
    plugins: { json },
  },
  {
    extends: [ 'markdown/recommended' ],
    files: [ '**/*.md' ],
    language: 'markdown/gfm',
    plugins: { markdown },
  },
  {
    extends: [ 'css/recommended' ],
    files: [ '**/*.css' ],
    language: 'css/css',
    plugins: { css },
    rules: {
      'css/use-baseline': 'off',
    },
  },
  {
    extends: [ 'js/recommended' ],
    files: [ '**/*.{js,mjs,cjs}' ],
    plugins: { '@stylistic': stylistic, js },
    rules: {
      '@stylistic/array-bracket-spacing': [ 'error', 'always' ],
      '@stylistic/dot-location': [ 'error', 'property' ],
      '@stylistic/indent': [ 'error', 2 ],
      '@stylistic/max-len': [ 'error', { code: 120, ignoreComments: true } ],
      '@stylistic/no-multiple-empty-lines': [ 'error', { max: 2, maxEOF: 1 } ],
      '@stylistic/quote-props': [ 'error', 'as-needed' ],
      '@stylistic/quotes': [ 'error', 'single', { avoidEscape: true, allowTemplateLiterals: 'avoidEscape' } ],
      'no-console': [ 'warn' ],
      'no-unused-vars': [ 'warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' } ],
      'prefer-const': [ 'error' ],
      '@stylistic/comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          exports: 'always-multiline',
          functions: 'never',
          imports: 'always-multiline',
          objects: 'always-multiline',
        },
      ],
    },
  },
]);
