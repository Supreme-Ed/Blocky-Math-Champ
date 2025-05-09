module.exports = {
  root: true,
  env: { node: true, es2021: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:@typescript-eslint/strict"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    project: "./tsconfig.node.json",
    tsconfigRootDir: __dirname
  },
  plugins: ["@typescript-eslint"],
  rules: {
    // TypeScript specific rules
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-empty-function": "warn",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/prefer-as-const": "error",
    "@typescript-eslint/consistent-type-imports": ["warn", { "prefer": "type-imports" }],
    "@typescript-eslint/consistent-type-definitions": ["warn", "interface"]
  }
};
