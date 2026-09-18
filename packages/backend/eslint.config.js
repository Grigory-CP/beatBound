import js from "@eslint/js";

export default [
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      parserOptions: {
        sourceType: "module"
      }
    },
    rules: {
      ...js.configs.recommended.rules
    }
  }
];
