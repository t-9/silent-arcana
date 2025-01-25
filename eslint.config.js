import globals from "globals";
import js from "@eslint/js";
import * as tseslint from "@typescript-eslint/eslint-plugin";
import * as parser from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        process: true,
        global: true,
        NodeJS: true,
        MediaStreamConstraints: true,
        MediaTrackConstraints: true
      },
      parser: parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      // 標準のno-unused-varsを無効化
      'no-unused-vars': 'off',
      // TypeScriptのno-unused-varsを有効化し、アンダースコアで始まる変数/引数を無視
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // TypeScriptの推奨ルールを有効化
      ...tseslint.configs.recommended.rules
    }
  }
];