import css from '@eslint/css';
import globals from 'globals';
import js from '@eslint/js';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
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
  },
  {
    extends: [ 'js/recommended' ],
    files: [ '**/*.{js,mjs,cjs}' ],
    plugins: { '@stylistic': stylistic, js },
    rules: {
      '@stylistic/array-bracket-spacing': [ 'error', 'always' ],
      '@stylistic/comma-dangle': [ 'error', 'always-multiline' ],
      '@stylistic/dot-location': [ 'error', 'property' ],
      '@stylistic/indent': [ 'error', 2 ],
      '@stylistic/max-len': [ 'error', { code: 120, ignoreComments: true } ],
      '@stylistic/quote-props': [ 'error', 'as-needed' ],
      '@stylistic/quotes': [ 'error', 'single', { avoidEscape: true, allowTemplateLiterals: 'avoidEscape' } ],
      'no-console': [ 'warn' ],
      'no-unused-vars': [ 'warn' ],
      'prefer-const': [ 'error' ],
    },
  },
]);
