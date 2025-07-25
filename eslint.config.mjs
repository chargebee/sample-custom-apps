export default [
  {
    files: ["**/*.mjs"], // Specify which files to lint
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      indent: ["warn", 2],
      "no-console": "warn",
    },
  },
  {
    files: ["**/*.test.mjs", "**/*.spec.mjs"],
    rules: {
      "no-console": "off",
    },
  },
];