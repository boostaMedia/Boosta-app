/**
 * Conventional Commits enforcement.
 * @see https://www.conventionalcommits.org/
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
      ],
    ],
    // lower-case allows conventional scopes like `i18n`, `ui`, and `phase-01`.
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "never", ["upper-case", "pascal-case", "start-case"]],
  },
};

export default config;
