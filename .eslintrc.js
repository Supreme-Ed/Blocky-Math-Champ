module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  parser: "@babel/eslint-parser",
  parserOptions: {
    requireConfigFile: false,
    babelOptions: { presets: ["@babel/preset-react"] }
  },
  plugins: ["react"],
  settings: { react: { version: "detect" } }
};
