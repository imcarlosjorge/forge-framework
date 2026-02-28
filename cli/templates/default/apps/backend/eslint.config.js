import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// sobe até o root do PROJETO GERADO (não do template)
const rootEslintConfigPath = resolve(__dirname, "../../eslint.config.js");
const { forgeBaseConfig } = await import(rootEslintConfigPath);

const backendConfig = [
  ...forgeBaseConfig,
  {
    files: ["**/*.ts"],
    rules: {
      // se quiser algo específico de Node depois, entra aqui
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: resolve(__dirname, "../../tsconfig.base.json"), // caminho para o tsconfig do pacote ou da raiz
        },
      },
    },
  },
];
export default backendConfig;
