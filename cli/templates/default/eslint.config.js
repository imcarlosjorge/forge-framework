import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default [
  // 🔒 SEMPRE no topo (vale pra frontend + backend)
  {
    ignores: [
      "**/dist/**", // builds
      "**/node_modules/**", // deps em qualquer pacote
      "**/*.d.ts", // tipos gerados
      "**/.turbo/**", // cache do turbo
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // regras globais
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/no-default-export": "error",
      "import/no-named-default": "error",
      "import/no-anonymous-default-export": "error",
    },
  },

  // exceções conscientes (configs)
  {
    files: [
      "**/*.config.{js,ts}",
      "**/eslint.config.js",
      "**/stylelint.config.cjs", // 👈 boa prática incluir também
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },
];
