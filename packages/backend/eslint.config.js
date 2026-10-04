import js from "@eslint/js";

export default [
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        process: "readonly",
        console: "readonly"
      },
      parserOptions: {
        sourceType: "module"
      }
    },
    rules: {
      ...js.configs.recommended.rules
    }
  }
];
