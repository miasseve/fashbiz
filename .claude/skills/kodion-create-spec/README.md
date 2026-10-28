# Kodion – Create Spec

**Version 2.6.0** · see [CHANGELOG.md](CHANGELOG.md) for what changed

A Claude Code skill that turns a short task description into a clear requirements spec that anyone can read. The same file is then filled in by plan mode, and after coding by the developer.

**It's built to be reviewed in about a minute.** Every spec opens with an `AT A GLANCE` box — the goal, what changes, what we won't do, what must not change, the danger, the counts, what's blocking, and a verdict — plus at most one small plain-text drawing. If the box looks right, reply `approve`. The file is about ten lines longer than before; the part anyone has to read drops from about sixty lines to ten.

Reads the screenshots attached to the task, and works whether or not the project is on git.

## What's inside

```
kodion-create-spec/
├── SKILL.md                      The skill: what Claude does, step by step
├── README.md                     This file
├── CHANGELOG.md                  What changed in each version
├── references/
│   ├── quality-rules.md          Writing rules, 14 blockers, 100-point score
│   ├── risk-matrix.md            Size vs Risk, and what each Risk level needs
│   ├── safety-checklist.md       The 16 safety rows in every spec
│   ├── coverage-checklist.md     Every place it appears, its whole life, tester misses
│   ├── lessons-learned.md        Mistakes from past tasks (a person adds to it)
│   └── visuals.md                The At a glance box, the one drawing, and the limits
├── templates/
│   ├── spec-template.md          Full spec (Medium / Large, or Medium / High risk)
│   └── spec-small.md             Small spec (Small size and Low risk)
├── examples/
│   ├── example-spec.md           A finished full spec (testimonial section)
│   └── example-spec-small.md     A finished small spec (footer colour)
└── tests/
    └── test-cases.md             96 tests to check the skill works
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

## Small spec or full spec

The skill picks one automatically:

| | **Small spec** | **Full spec** |
|---|---|---|
| **For** | Small size **and** Low risk: text, colour, label, one field, a small fix on one screen | Everything else, including small changes that touch money, login, permissions, saved data or personal data |
| **To review** | The 10-line box, then ~55 lines if a row looks wrong | The 10-line box, then ~70 lines of Part A if a row looks wrong |
| **Questions** | Only if needed, at most 2 | Up to 2 rounds |
| **Plan** | Short: files and one check per requirement | Full: every layer |

Force one with `/kodion-create-spec <ID> --small` or `--full`. `--small` doesn't work for Medium or High risk. If a small task turns out bigger, the skill (or plan mode) switches to the full spec and says why.

## Approving

Type `approve`. That's it — **there is no role check.** Whoever reviews the spec can approve it, at
any risk level: no senior question, no client sign-off, no waiting. Your name comes from
`git config user.name`; you're never asked to type it.

- Approving on someone else's behalf (they said yes in chat or on a call): type `approve for <their name>`.
- A spec is still never approved while a §10 question blocks planning.
- Risk decides how much care the spec and plan need, not who signs them off.

## Changes after a task is finished

| Situation | What to do |
|---|---|
| Not shipped yet (branch still exists) | Ask for the change in the same session. The spec goes back to Draft and is approved again. |
| Already shipped (merged, branch deleted) | New task on the Task Board → new Claude session → `/start-task <new number>` → `/kodion-create-spec <new number>`. Write "Follow-up to #<old>" in the description; the new spec links back to it. |
| A bug in shipped work | Same: a new bug task, with its own `fix/` branch and its own logs. |

## Reviewing a spec

Every full spec has three parts. A small spec has only Parts A and C.

| Part | What's in it | Who reads it |
|---|---|---|
| **A — Review this** | At a glance box, one drawing (or none), why + quality, requirements, decisions to check, questions, the reply line | Reviewer: the box first, the rest only if a row looks wrong |
| **B — Details** (folded) | Who uses it, where it appears, what can go wrong, all checks, safety, today's page | Only if something in Part A looks wrong |
| **C — For plan mode** (folded) | Plan-mode instructions, technical summary, done report, quality check | No review needed |

Folded parts open with one click in GitHub and in VS Code's Markdown preview.

**Replying:** the end of Part A tells you exactly what to type — `approve`, or `D1 change: <what instead>`, or `Q2: <your answer>`. You don't have to write a paragraph.

**The drawing** is a Mermaid block — a real diagram in VS Code preview (with the Markdown Preview Mermaid Support extension), on GitHub and in the Claude app, and code in the Claude Code session. Put `mermaid+text` in `.claude/spec-visuals` and a plain-text copy goes under it for whoever reviews in the terminal; `mermaid` gives the diagram alone. Install `mermaid-ascii` and the copy is generated instead of hand-drawn. There is never more than one drawing per spec, and only when it replaces words.

## Which version do I have?

- Open `SKILL.md`: the version is at the top.
- Every spec header shows the version that made it: `Skill: kodion-create-spec v2.6.0`.
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
| 7 | `/ship` | Commit, push, PR — doesn't run on a project with no git | `commit` · `push` · `pr_merge` · `back_to_main` · `delete_branch` |

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

Work through `tests/test-cases.md` in a real project. Start with tests 1, 2, 8 and 13 (the estimate-edit test), then 40–44 for the flow with `/start-task`, then 51–63 for small specs, approval and follow-ups, then 64–70 for the review layout, 71–79 for screenshots and projects with no git, 80–87 for the Mermaid drawings, and 88–96 for the v2.6.0 speed fixes. Send the filled-in table back, with the specs it produced.

## Changing the skill

| To change | Edit |
|---|---|
| Sections of the spec | `templates/spec-template.md`, and the Step 4 table in `SKILL.md` |
| The At a glance box, or which drawings are allowed | `references/visuals.md`, and the box in both templates |
| What counts as High risk | `references/risk-matrix.md` |
| Blockers or the score | `references/quality-rules.md` |
| Safety rows | `references/safety-checklist.md`, and the §7 table in the template |
| Add a lesson after a tester finds a miss | `references/lessons-learned.md` (all projects) or `<project>/.claude/rules/lessons-learned.md` (one project) |
| Places, stages or tester questions | `references/coverage-checklist.md`, and the §4.4 tables in the template |

After any change, rerun tests 1, 2, 8 and 13.
