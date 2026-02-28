import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { forgeBaseConfig } from "../../eslint.config.js";

const frontendConfig = [
  ...forgeBaseConfig,

  // ❌ Não aplicar regras TS em configs do ESLint
  {
    files: ["**/eslint.config.{js,ts}"],
    rules: {
      "@typescript-eslint/typedef": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      ...reactRefresh.configs.vite.rules,

      // regras específicas do frontend
    },
  },
];
export default frontendConfig;
