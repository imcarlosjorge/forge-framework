// apps/backend/eslint.config.js
import { forgeBaseConfig } from "../../eslint.config.js";

const backendConfig = [
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
    files: ["**/*.ts"],
    rules: {
      // se quiser algo específico de Node depois, entra aqui
    },
  },
];

export default backendConfig;
