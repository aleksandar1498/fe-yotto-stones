// eslint.config.mjs
import js from '@eslint/js';
import * as ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import unusedImports from 'eslint-plugin-unused-imports';
import eslintImport from 'eslint-plugin-import';
import promise from 'eslint-plugin-promise';
import prettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'unused-imports': unusedImports,
      import: eslintImport,
      promise,
      prettier,
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-case-declarations': 'off',
    
      // ✅ Avoid unnecessary re-renders
      'react/jsx-key': 'warn', // Ensures stable list rendering
      'react/no-array-index-key': 'off', // Index as key causes remounts
      'react/no-unstable-nested-components': 'warn', // Prevents inline components that trigger re-renders
      'react/jsx-no-useless-fragment': 'warn', // Avoids fragment bloat
    
      // ✅ Hooks performance
      'react-hooks/rules-of-hooks': 'error', // Prevents misuse of hooks
      'react-hooks/exhaustive-deps': 'warn', // Ensures useEffect/useCallback deps are correct
    
      // ✅ Prevent memory-heavy code
      'no-new-func': 'error', // Avoid dynamic `new Function()` which is memory-costly
      'no-implied-eval': 'error', // Prevents `setTimeout('code')` kind of usage
    
      // ✅ Prevent constant recreation of functions/objects
      'no-extra-bind': 'warn', // Avoid binding methods inside render
      'no-useless-concat': 'warn', // Prevent inefficient string operations
      'prefer-const': 'warn', // Prevent reassignable memory allocation
      'prefer-spread': 'warn', // More efficient than apply()
    
      // ✅ Promise + async usage that may bloat memory
      'promise/no-nesting': 'warn', // Avoids deeply nested promises
      'promise/always-return': 'warn', // Ensures predictable async flow
      'promise/no-return-wrap': 'warn',
    
      // ✅ Import-related bloat
      'import/no-duplicates': 'warn',
      'import/no-cycle': ['warn', { maxDepth: 1 }],
      'import/no-useless-path-segments': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
