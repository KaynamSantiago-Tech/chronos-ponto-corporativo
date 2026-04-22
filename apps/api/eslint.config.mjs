// Flat config mínima para ESLint 9 sem plugins externos — depende só do pacote
// `eslint` que já está em devDependencies. Regras fortes são cobertas por
// `pnpm typecheck` + vitest; aqui cuidamos de rastros básicos.

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "prefer-const": "error",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "prisma/migrations/**", "**/*.spec.ts"],
  },
];
