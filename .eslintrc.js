module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["google", "prettier"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
  },
  plugins: ["prettier"],
  rules: {
    "require-jsdoc": 0,
    "max-len": ["error", {code: 120}],
    "guard-for-in": 0,
    "prettier/prettier": "error",
  },
};
