import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/no-default-export": "error",
      "import/no-named-default": "error",
      "import/no-anonymous-default-export": "error",
    },
  },

  {
    files: ["**/*.config.{js,ts}", "**/eslint.config.js"],
    rules: {
      "import/no-default-export": "off",
      "@typescript-eslint/typedef": "off",
    },
  },
];