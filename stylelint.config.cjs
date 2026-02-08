module.exports = {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
  ],
  rules: {
    'rule-empty-line-before': null,
    'declaration-empty-line-before': null,
    'color-function-alias-notation': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'color-hex-length': null,
  }
}
