# CLAUDE.md Upgrade: Requirement Document

**Owner:** Kodion Engineering
**Applies to:** Kodion-owned, fully controlled project repos (Laravel, React, Next.js, or any other stack)
**Type:** Restructure only. No new rules, no behaviour change.

---

## 1. What we want to achieve

Our projects already have Claude Code instructions: a `CLAUDE.md`, sometimes extra `.md` rule files, and sometimes `.claude/` settings, commands or agents. They work, but they are organised differently in every project.

This upgrade moves the **existing** instructions into one standard, well-organised layout:

- a short root `CLAUDE.md`
- topic files in `.claude/rules/`
- inactive templates for missing areas

**Claude must behave exactly as it did before.** Every instruction that exists today must still exist and still load after the upgrade. We are changing where instructions live, not what they say.

Once every project shares this layout, future upgrades (shared security rules, API conventions and so on) can be added the same way everywhere. Those upgrades are **not** part of this task.

---

## 2. Golden rules (non-negotiable)

1. **No new instructions.** Do not add, improve, reword or "fix" any rule. Move text exactly as it is written. Changing a heading or bullet style is allowed only when needed to fit the new file.
2. **No lost instructions.** Every instruction in the old files must appear in exactly one new location. This is proven by the mapping report (section 6).
3. **No application code changes.** Only Claude-related files change. `git diff` must show no changes to source code, configs, migrations, `package.json`, `composer.json` and similar files.
4. **No stack assumptions.** Detect the stack from the project itself (`composer.json`, `package.json`, `artisan`, `next.config.*`, folder structure). Nothing about the stack is predefined in this document.
5. **Contradictions are logged, not fixed.** If two instructions conflict, keep both and list the conflict in the report. Resolving it is a separate task.
6. **Code wins over docs.** If a rule describes something the code doesn't do, keep the rule as-is and list the mismatch in the report.
7. **Plan first, approve, then execute.** Claude Code makes a plan in plan mode. The developer reviews and approves it before any file is changed.

---

## 3. Areas that need careful handling

These are the places where a restructure can silently change Claude's behaviour. The plan must address each one explicitly.

### 3.1 Loading behaviour must stay the same
- Everything in the root `CLAUDE.md` loads at the start of every session today.
- A rule file in `.claude/rules/` **without** `paths:` frontmatter also loads at the start of every session. **This is the default for all moved content**, because it keeps the loading behaviour identical.
- A rule file **with** `paths:` frontmatter loads only when Claude touches matching files. This changes behaviour, so it is **not allowed** in this upgrade, except where the original instruction was itself explicitly limited to specific files. Each such case must be flagged in the report.

### 3.2 `@` imports
- Existing imports such as `@docs/api.md` or `@DESIGN.md` must keep working.
- Import paths resolve **relative to the file that contains them**. If an import line moves into a different folder, the path breaks. **Keep all existing `@` imports in the root `CLAUDE.md`, with their paths unchanged.**
- The correct syntax is `@path/to/file`. If a project uses a wrong form such as `@import file.md`, do not fix it. List it in the report under "Found issues".

### 3.3 Files Claude Code loads from fixed locations: do not move
These files work because of where they are. They keep their exact paths and content:
- `.claude/settings.json`, `.claude/settings.local.json`
- `.mcp.json` (project MCP servers)
- `.claude/commands/`, `.claude/skills/`, `.claude/agents/`
- hook scripts and the hooks config inside `settings.json`
- nested `CLAUDE.md` files in subfolders (for example `backend/CLAUDE.md`). These load on demand when Claude works in that folder. Leave them where they are.
- `DESIGN.md`, `COMPONENTS.md` and any doc that `CLAUDE.md` imports or refers to by path
- `AGENTS.md`, `.cursorrules`, `.github/copilot-instructions.md` (other tools' files: untouched)

### 3.4 `.claude/rules/` loads every `.md` file
- Every `.md` file in `.claude/rules/` and its subfolders is loaded, including empty or template files.
- **Never put templates, blank placeholders or notes inside `.claude/rules/`.** Templates go in `.claude/templates/` (section 4.3), which Claude Code does not load.

### 3.5 `settings.json` is strict JSON
- It may not contain comments or trailing commas, and it may not be an empty file. Any of these causes a settings error at startup.
- If a project has **no** `.claude/settings.json`: create it containing only `{}`. This is valid and has no effect.
- If it exists, do not change it.
- The example or commented version goes in `.claude/templates/settings.example.md`.

### 3.6 Instructions spread across other files
- Some projects keep instructions in extra files, such as `docs/ai-rules.md` or `.claude/memory/*.md`, that `CLAUDE.md` tells Claude to read.
- If the file is imported or referenced from `CLAUDE.md`, keep the file and the reference as they are.
- Only content that lives **inside** `CLAUDE.md` (or `.claude/CLAUDE.md`) is split into rule files.

### 3.7 Duplicates
- If the same instruction appears in more than one place, keep it once.
- Merge only when the text is identical or clearly the same instruction.
- Log every merge in the report.

### 3.8 Personal files
- `CLAUDE.local.md` and `.claude/settings.local.json` are personal.
- Do not move their content into shared files.
- Make sure both are listed in `.gitignore`. This is the only change allowed outside `.claude/` and `CLAUDE.md`.

---

## 4. Target structure

### 4.1 Layout

```
project-root/
├── CLAUDE.md                     ← short: overview, stack, commands, file index, existing @imports
├── CLAUDE.local.md               ← personal, gitignored (only if it already exists)
├── DESIGN.md / other docs        ← unchanged, unmoved
├── .mcp.json                     ← unchanged (only if it already exists)
└── .claude/
    ├── settings.json             ← unchanged, or "{}" if it didn't exist
    ├── rules/                    ← ONLY real, existing instructions moved from CLAUDE.md
    │   ├── code-style.md
    │   ├── architecture.md
    │   ├── security.md
    │   ├── api-conventions.md
    │   ├── database.md
    │   ├── testing.md
    │   ├── git-workflow.md
    │   ├── ui-design.md
    │   └── <stack>/              ← only if the project has more than one stack (e.g. laravel/, react/)
    ├── templates/                ← NOT loaded by Claude; inactive skeletons for missing areas
    │   ├── README.md
    │   ├── rules/<area>.md
    │   └── settings.example.md
    ├── commands/ skills/ agents/ ← unchanged (only if they already exist)
    └── upgrade/
        └── REPORT.md             ← the mapping report (section 6)
```

### 4.2 What goes where

| Content found in the old CLAUDE.md | New location |
|---|---|
| Project overview, purpose | `CLAUDE.md` → `## Overview` |
| Stack and versions | `CLAUDE.md` → `## Stack` |
| Run, build, test and lint commands | `CLAUDE.md` → `## Commands` |
| Folder structure, key files | `CLAUDE.md` → `## File Index` |
| Existing `@` imports | `CLAUDE.md`, unchanged |
| Naming, formatting, language-style rules | `.claude/rules/code-style.md` |
| Folder/layer rules, patterns (services, repositories, components) | `.claude/rules/architecture.md` |
| Auth, validation, secrets, env, permissions | `.claude/rules/security.md` |
| Routes, request/response shape, status codes, versioning | `.claude/rules/api-conventions.md` |
| Migrations, models, queries, ORM usage | `.claude/rules/database.md` |
| Test conventions | `.claude/rules/testing.md` |
| Branches, commits, PRs | `.claude/rules/git-workflow.md` |
| UI, styling, design-system rules | `.claude/rules/ui-design.md` |
| Anything that fits no topic | `.claude/rules/general.md` |

- **Only create a rule file if there is existing content for it.** No empty rule files.
- The topic list above is the standard set. A project only gets the topics it actually has content for.
- **`CLAUDE.md` ends with a `## Rules` section** listing the rule files in backticks, for example `` `.claude/rules/security.md` ``. This list is for humans. It is not an import, and the rule files load on their own.

### 4.3 Templates for missing areas
- For each standard topic that has **no** existing content, create `.claude/templates/rules/<topic>.md`.
- Each template contains:
  - the `paths:` frontmatter, commented out
  - a short list of example headings, with no actual rules
- `.claude/templates/README.md` explains in a few lines how to activate a template:
  1. copy it into `.claude/rules/`
  2. fill it in
  3. get it reviewed as a normal PR, since that is a behaviour change
- `.claude/templates/settings.example.md` contains an example permissions block (allow lint/test/build, deny destructive commands) inside a code block, for reference only.
- **Templates must not contain real rules or opinions.** They are empty skeletons.

---

## 5. Verification checks

All checks must pass before the PR is opened.

| # | Check | How |
|---|---|---|
| V1 | Every old instruction is accounted for | Mapping table in REPORT.md: 100% of inventory IDs have a new location or a "merged duplicate" note |
| V2 | No instruction reworded | Spot-check 10 random rows: old text = new text |
| V3 | Everything still loads at start | `/context` after: every new rule file and `CLAUDE.md` appear under **Memory files** |
| V4 | Context size about the same | Memory token count after is within a small margin of the baseline. A big drop means content was lost or made path-scoped. |
| V5 | Imports still resolve | Every `@` import from before still appears in `/context` |
| V6 | No app code touched | `git diff --stat` against the base branch lists only `CLAUDE.md`, `.claude/**` and `.gitignore` |
| V7 | Settings valid | Claude Code starts with no Settings Error; `settings.json` is valid JSON |
| V8 | No templates loading | Nothing from `.claude/templates/` appears in `/context` |
| V9 | Same answers | Ask Claude the same 3 questions before and after (e.g. "What are this project's rules for API responses?", "How should I name a new component/controller?", "What must I never do in this project?"). Answers must match in substance. |

---

## 6. The report: `.claude/upgrade/REPORT.md`

The report is the proof that nothing changed. It must contain:

1. **Summary:** project name, detected stack, date, developer, files before → files after.
2. **Baseline vs after:** the `/context` memory file list and token count, before and after.
3. **Mapping table**, one row per instruction:

   | ID | Instruction (short) | Old file : line | New file | Loads | Status |
   |---|---|---|---|---|---|
   | R-001 | Use FormRequest for validation | CLAUDE.md:42 | .claude/rules/security.md | always | moved |
   | R-002 | Commit messages in conventional format | CLAUDE.md:88 | .claude/rules/git-workflow.md | always | moved |
   | R-003 | Same as R-001 | docs/rules.md:10 | — | — | merged duplicate of R-001 |

   - `Loads` is `always`, or `paths: …` with a reason.
   - `Status` is one of: `moved`, `kept in place`, `merged duplicate`, `path-scoped (flagged)`.

4. **Unchanged files:** list of Claude files kept exactly as they were (settings, commands, agents, nested CLAUDE.md, imported docs).
5. **New files:** every file created, including templates and `{}` settings.
6. **Found issues (not fixed):** contradictions, wrong import syntax, rules that don't match the code, outdated rules.
7. **Verification results:** V1–V9, each pass/fail with a note.

---

## 7. Definition of done

The task is done when **all** of these are true:

- [ ] Plan was reviewed and approved by the developer before execution
- [ ] Root `CLAUDE.md` holds only overview, stack, commands, file index, the existing `@` imports and the `## Rules` list
- [ ] All other existing instructions live in `.claude/rules/<topic>.md`, loading always, unless flagged in the report
- [ ] No rule file exists without real, moved content; missing areas exist only as templates in `.claude/templates/`
- [ ] Fixed-location files (section 3.3) are unchanged and unmoved
- [ ] `.claude/settings.json` exists and is valid JSON (`{}` if newly created)
- [ ] `CLAUDE.local.md` and `.claude/settings.local.json` are in `.gitignore`
- [ ] `.claude/upgrade/REPORT.md` exists with 100% of instructions mapped
- [ ] Verification checks V1–V9 all pass
- [ ] `git diff` shows changes only in `CLAUDE.md`, `.claude/**` and `.gitignore`
- [ ] PR opened and approved by a senior

---

## 8. Out of scope (do not do in this task)

- Writing new rules, or completing missing areas (security, API, DB and so on)
- Changing permissions, hooks, MCP servers, commands, agents or skills
- Converting rules to path-scoped loading for optimisation
- Fixing contradictions, outdated rules or wrong import syntax (log them only)
- Creating DESIGN.md, specs or any other new docs
- Shared cross-project standards (a future upgrade will build on this layout)
