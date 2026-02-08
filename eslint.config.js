import js from "@eslint/js"
import tseslint from "typescript-eslint"
import importPlugin from "eslint-plugin-import"

export default [
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

  // exceção consciente (configs)
  {
    files: ["**/*.config.{js,ts}",
      "**/eslint.config.js"
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },
]
