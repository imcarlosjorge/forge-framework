import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// sobe até o root do PROJETO GERADO (não do template)
const rootEslintConfigPath = resolve(__dirname, "../../eslint.config.js");
const { forgeBaseConfig } = await import(rootEslintConfigPath);

const frontendConfig = [
  ...forgeBaseConfig,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: resolve(__dirname, "../../tsconfig.base.json"),
        },
      },
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
