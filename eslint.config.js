import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export const forgeBaseConfig = [
  // 🔒 SEMPRE no topo (vale pra frontend + backend)
  {
    ignores: [
      "**/dist/**",          // builds
      "**/node_modules/**",  // deps em qualquer pacote
      "**/*.d.ts",           // tipos gerados
      "**/.turbo/**",        // cache do turbo
      "**/eslint.config.js",
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
      // 👇 regras de tipagem do Forge (comuns a front + back)
      "@typescript-eslint/explicit-function-return-type": "error",// 🔒 Obriga tipar retorno de função
      "@typescript-eslint/explicit-module-boundary-types": "error",// 🔒 Obriga tipar exports e APIs públicas
      "@typescript-eslint/no-explicit-any": "error",// 🔒 Evita implicit any em callbacks
      "@typescript-eslint/no-inferrable-types": "off",// 🔒 Permite tipar coisas “óbvias” (const x: number = 1)
      "@typescript-eslint/typedef": [
        "error",// 🔥 Força tipagem em variáveis e parâmetros
        {
          "arrayDestructuring": true,
          "arrowParameter": true,
          "memberVariableDeclaration": true,
          "objectDestructuring": true,
          "parameter": true,
          "propertyDeclaration": true,
          "variableDeclaration": true
        }
      ]
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