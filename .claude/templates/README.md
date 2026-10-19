# Claude Rule Templates

These are inactive skeletons for standard rule topics. Claude Code does
**not** load anything from `.claude/templates/`.

## How to activate a template

1. Copy the file into `.claude/rules/`
   (e.g. `cp .claude/templates/rules/code-style.md .claude/rules/code-style.md`)
2. Fill in the rules — write what your team actually follows.
3. Submit as a normal PR, since activating a rule file changes Claude's behaviour.

## Available templates

- `rules/code-style.md` — Naming, formatting, language-style rules
- `rules/architecture.md` — Folder/layer rules, patterns
- `rules/security.md` — Auth, validation, secrets, env, permissions
- `rules/api-conventions.md` — Routes, request/response shape, status codes
- `rules/database.md` — Models, queries, ORM usage
- `rules/testing.md` — Test conventions
- `rules/git-workflow.md` — Branches, commits, PRs
- `rules/ui-design.md` — UI, styling, design-system rules
