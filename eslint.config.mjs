import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import babelParser from '@babel/eslint-parser';

// Setup for proper paths and compat
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize FlatCompat for extending ESLint configurations
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// ESLint flat configuration format
export default [
  // Extend the recommended Next.js configuration
  ...compat.extends('next/core-web-vitals'),

  // Correctly add parser as an object
  {
    files: ['**/*.js', '**/*.ts'], // Specify the files that should use this configuration
    languageOptions: {
      parser: babelParser, // Use parser as an object (imported babel-parser)
      parserOptions: {
        ecmaVersion: 2020, // Allow modern JavaScript syntax
        sourceType: 'module', // Support for ES modules
      },
    },
  },
];
