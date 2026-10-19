# Kodion – Create Spec

**Version 2.1.0** · see [CHANGELOG.md](CHANGELOG.md) for what changed

A Claude Code skill that turns a short task description into a clear requirements spec that anyone can read. The same file is then filled in by plan mode, and after coding by the developer.

## What's inside

```
kodion-create-spec/
├── SKILL.md                      The skill: what Claude does, step by step
├── README.md                     This file
├── CHANGELOG.md                  What changed in each version
├── references/
│   ├── quality-rules.md          Writing rules, 12 blockers, 100-point score
│   ├── risk-matrix.md            Size vs Risk, and what each Risk level needs
│   ├── safety-checklist.md       The 16 safety rows in every spec
│   ├── coverage-checklist.md     Every place it appears, its whole life, tester misses
│   └── lessons-learned.md        Mistakes from past tasks (a person adds to it)
├── templates/
│   └── spec-template.md          The structure every spec follows
├── examples/
│   └── example-spec.md           A finished spec (testimonial section)
└── tests/
    └── test-cases.md             39 tests to check the skill works
```

## Install

This skill works together with `/start-task` (already installed) and its `log-step.sh`. This package adds the skill, an updated `log-step.sh` with a `--retry` mode, and the shared rules file. Unzip it in the **project root**:

```
<your-project>/.claude/
  skills/kodion-create-spec/      this skill
  skills/start-task/              /start-task (step 1 of the flow)
  skills/start-task/scripts/log-step.sh   sends workflow steps to the timesheet (now with --retry)
  rules/task-workflow.md          shared file formats every skill follows
```

Then restart Claude Code. Type `/` and check that `kodion-create-spec` and `start-task` appear.

> If your project still has the old `.claude/commands/create-spec.md`, remove it so the two don't get mixed up.

**Timesheet key (once per developer):** copy `.claude/skills/start-task/settings.local.example.json` to `.claude/settings.local.json` and paste your `kdw_…` key. That file is git-ignored. Both the GET and POST APIs use the same key.

## Use

**1. Start the task**
```
/start-task 316
```
Fetches the task, creates the branch, and logs `start_session`, `pull_latest` and `create_branch`.

**2. Rename the session** to the name `/start-task` prints. The spec step asks you once and logs `rename_session`.

**3. Create the spec**
```
/kodion-create-spec 316
```
Reads the task from `.claude/tasks/316/task.json`, asks a few questions, saves `.claude/specs/316-<slug>.md`, and logs `write_spec` and `save_spec`.

Not a timesheet task? `/kodion-create-spec 01 | Testimonial section | Add customer quotes` still works, without logging.

**4. Review and approve.** Read Part A, check §9 and answer §10, then reply `approve`. This logs `review_spec`.

**5. Plan.** Open plan mode and say:
```
Read .claude/specs/316-<slug>.md and follow §12.
```
Plan mode writes `.claude/plans/`, fills §13, and logs `plan`, then `implement`, `validate` and `iterate` as each happens.

**6. Ship.** `/ship` commits, pushes and opens the PR, and logs the Ship steps.

## Reviewing a spec

Every spec has three parts:

| Part | What's in it | Who reads it |
|---|---|---|
| **A — Review this** | Summary, requirements, decisions to check, questions | Reviewer: about 2 minutes |
| **B — Details** (folded) | Who uses it, where it appears, what can go wrong, all checks, safety, today's page | Only if something in Part A looks wrong |
| **C — For plan mode** (folded) | Plan-mode instructions, technical summary, done report, quality check | No review needed |

Folded parts open with one click in GitHub and in VS Code's Markdown preview.

## Which version do I have?

- Open `SKILL.md`: the version is at the top.
- Every spec header shows the version that made it: `Skill: kodion-create-spec v2.1.0`.
- To update: replace your `kodion-create-spec` folder with the latest one from the team's shared location, then restart Claude Code.

## The flow

| Step | Who | Writes | Timesheet steps |
|---|---|---|---|
| 1 | `/start-task <ID>` | `.claude/tasks/<ID>/task.json`, branch | `start_session` · `pull_latest` · `create_branch` |
| 2 | Developer renames the session | – | `rename_session` (logged by this skill) |
| 3 | `/kodion-create-spec <ID>` | `.claude/specs/<ID>-<slug>.md` | `write_spec` · `save_spec` |
| 4 | Reviewer says `approve` | Status → Approved | `review_spec` |
| 5 | Plan mode (§12) | `.claude/plans/<ID>-<slug>.md`, §13 | `plan` |
| 6 | Developer + Claude | Code, §14 | `implement` · `validate` · `iterate` |
| 7 | `/ship` | Commit, push, PR | `commit` · `push` · `pr_merge` · `back_to_main` · `delete_branch` |

Every step is sent with `bash .claude/skills/start-task/scripts/log-step.sh <ID> <step>`. It also writes a line to `.claude/tasks/<ID>/log.jsonl`. If the timesheet can't be reached, the step waits there and is resent on the next run.

## What the skill will never do

- Write code, or change any file outside `.claude/specs/` (apart from the `spec` field in `task.json`)
- Create or switch a branch, commit, or push
- Call the timesheet API directly, or read your key (only `log-step.sh` does that)
- Decide files, database changes or the tech stack (plan mode does that)
- Approve a spec while a question still blocks planning
- Push, merge, deploy or open a PR (and §12 tells plan mode the same)
- Copy real names, emails or phone numbers from screenshots
- Decide business rules by itself (it asks; only small UI details go to "Decisions I made" for approval)

## Testing

Work through `tests/test-cases.md` in a real project. Start with tests 1, 2, 8 and 13 (the estimate-edit test), then 40–44 for the flow with `/start-task`. Send the filled-in table back, with the specs it produced.

## Changing the skill

| To change | Edit |
|---|---|
| Sections of the spec | `templates/spec-template.md`, and the Step 4 table in `SKILL.md` |
| What counts as High risk | `references/risk-matrix.md` |
| Blockers or the score | `references/quality-rules.md` |
| Safety rows | `references/safety-checklist.md`, and the §7 table in the template |
| Add a lesson after a tester finds a miss | `references/lessons-learned.md` (all projects) or `<project>/.claude/rules/lessons-learned.md` (one project) |
| Places, stages or tester questions | `references/coverage-checklist.md`, and the §4.4 tables in the template |

After any change, rerun tests 1, 2, 8 and 13.
