module.exports = {
  root: true,
  env: { browser: true, es2021: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  parser: "@babel/eslint-parser",
  parserOptions: {
    requireConfigFile: false,
    babelOptions: { presets: ["@babel/preset-react"] }
  },
  plugins: ["react", "react-hooks"],
  settings: { react: { version: "detect" } }
};
