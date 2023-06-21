module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  rules: {
    "no-underscore-dangle": "off",
    "class-methods-use-this": "warn",
    "import/prefer-default-export": "off",
  },
};