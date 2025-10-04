import globals from "globals";
import pluginJs from "@eslint/js";
import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from '@typescript-eslint/parser';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}", "!dist/**"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'], // Apply to TypeScript files
    ignores: ['dist/**'], // Ignore dist files
    languageOptions: {
        parser: tsParser, // Use TypeScript parser
        parserOptions: {
            project: './tsconfig.json', // Link to your TypeScript project
            tsconfigRootDir: './', // Optional, ensures correct tsconfig resolution
        },
        globals: {
            process: 'readonly', // Define Node.js global 'process'
        },
    },
    plugins: {
        '@typescript-eslint': typescriptPlugin, // Load TypeScript plugin
    },
    rules: {
        ...typescriptPlugin.configs.recommended.rules, // Use recommended TypeScript rules
        '@typescript-eslint/no-unused-vars': [
            'warn',
            { argsIgnorePattern: '^_' }, // Ignore variables starting with "_"
        ],
    },
    },
];