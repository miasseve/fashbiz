# Upgrade Report: CLAUDE.md & .claude/ Folder Setup

## 1. Summary

| Field | Value |
|-------|-------|
| Project | fashbiz / Ree (re-e.dk) |
| Detected stack | Next.js 16, React 19, MongoDB/Mongoose, JavaScript |
| Date | 2026-10-19 |
| Instruction files before | 0 (no CLAUDE.md, no rule files) |
| Instruction files after | 1 (`CLAUDE.md` — factual metadata only, no rules) |
| Rule files created | 0 |
| Template files created | 8 (in `.claude/templates/rules/`) |
| Other new files | 4 (`settings.json`, `templates/README.md`, `templates/settings.example.md`, this report) |

## 2. Baseline vs After

| Metric | Before | After |
|--------|--------|-------|
| `/context` memory files | (none) | `CLAUDE.md` |
| Approximate token count | 0 | ~500 (root CLAUDE.md only) |
| Rule files loading | 0 | 0 |
| `@` imports | 0 | 0 |

No instructions were added, removed, or reworded. The token increase is entirely from
factual project metadata (overview, stack, commands, file index).

## 3. Mapping Table

No pre-existing Claude instructions were found anywhere in the project. There is nothing
to map.

| ID | Instruction (short) | Old file : line | New file | Loads | Status |
|----|---------------------|-----------------|----------|-------|--------|
| — | No pre-existing instructions found | — | — | — | — |

## 4. Unchanged Files

These files existed before the upgrade and were not moved or modified:

- `.claude/settings.local.json` — personal settings (now gitignored)
- `.claude/skills/ship/SKILL.md` — ship skill definition
- `.claude/specs/01-claude.md_and_calude_folder-setup.md` — this upgrade's spec
- `DESIGN.md` — pricing page design system doc
- `docs/LESTORES_CLIENT_API_CONTRACTS.md` — API audit doc
- `README.md` — project readme

## 5. New Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Root instruction file (overview, stack, commands, file index, rules pointer) |
| `.claude/settings.json` | Valid empty settings (`{}`) |
| `.claude/templates/README.md` | Explains how to activate template rule files |
| `.claude/templates/rules/code-style.md` | Template: naming, formatting, language style |
| `.claude/templates/rules/architecture.md` | Template: folder/layer rules, patterns |
| `.claude/templates/rules/security.md` | Template: auth, validation, secrets, permissions |
| `.claude/templates/rules/api-conventions.md` | Template: routes, request/response, status codes |
| `.claude/templates/rules/database.md` | Template: models, queries, ORM usage |
| `.claude/templates/rules/testing.md` | Template: test conventions |
| `.claude/templates/rules/git-workflow.md` | Template: branches, commits, PRs |
| `.claude/templates/rules/ui-design.md` | Template: UI, styling, design system |
| `.claude/templates/settings.example.md` | Reference: example permissions block |
| `.claude/upgrade/REPORT.md` | This report |

`.gitignore` was modified (2 lines appended for `CLAUDE.local.md` and `.claude/settings.local.json`).

## 6. Found Issues (not fixed)

1. **`docs/` is gitignored.** Lines 46–47 of `.gitignore` ignore `/docs/` and `docs/`,
   so `docs/LESTORES_CLIENT_API_CONTRACTS.md` is not committed. This is pre-existing
   behaviour, not introduced by this upgrade.

2. **Ship skill Co-Authored-By references `Claude Sonnet 5`.** The file
   `.claude/skills/ship/SKILL.md` line 43 uses `Claude Sonnet 5` in its Co-Authored-By
   template. The current system attribution uses `Claude Opus 4.6`. Per golden rule #1
   (no changes to existing instructions) and section 3.3 (skills/ are fixed-location
   files), this was not updated.

3. **No `.mcp.json` exists.** Not a problem — noted for completeness.

4. **`DESIGN.md` is not `@`-imported.** It contains design system rules for pricing
   components but was never referenced from a CLAUDE.md (which didn't exist). Adding
   an `@` import would be a new instruction, so it was not added. Consider adding
   `@DESIGN.md` to the root `CLAUDE.md` in a future update if desired.

## 7. Verification Results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| V1 | Every old instruction accounted for | PASS | 0 instructions existed; mapping table is empty |
| V2 | No instruction reworded | PASS | No old text to reword |
| V3 | Everything still loads at start | TO VERIFY | Run `/context` — confirm `CLAUDE.md` appears under Memory files |
| V4 | Context size about the same | PASS | Baseline was 0 tokens; after adds only ~500 tokens of factual metadata |
| V5 | Imports still resolve | PASS | No `@` imports existed before or after |
| V6 | No app code touched | TO VERIFY | Run `git diff --stat` — should show only `CLAUDE.md`, `.claude/**`, `.gitignore` |
| V7 | Settings valid | TO VERIFY | Start Claude Code — no Settings Error should appear; `settings.json` is `{}` |
| V8 | No templates loading | TO VERIFY | Run `/context` — nothing from `.claude/templates/` should appear |
| V9 | Same answers | PASS | No rules before, no rules after; Claude's behaviour is unchanged |
