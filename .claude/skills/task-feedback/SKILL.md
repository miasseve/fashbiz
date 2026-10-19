---
name: task-feedback
description: Kodion – Task Feedback. The last step of the Kodion spec-driven flow. After /ship, reviews how this task's Claude Code session went: was the spec in the right format, was the plan complete, was it built in one attempt, how many questions Claude asked, how often the developer corrected it, and whether the tests were run and passed. It writes a feedback report and asks the developer to confirm, then sends it to the Kodion Timesheet against the task. Runs automatically at the end of /ship when .claude/tasks/<ID>/task.json exists, or when the developer types /task-feedback <ID>.
argument-hint: <task number>   (optional: taken from the branch name)
metadata:
  version: 1.0.0
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Bash(bash .claude/skills/task-feedback/scripts/collect-metrics.sh:*), Bash(bash .claude/skills/task-feedback/scripts/post-feedback.sh:*), Bash(git branch --show-current), Bash(git diff --name-only:*), Bash(git log --oneline:*), Bash(date:*)
---

# Kodion – Task Feedback

**Version 1.0.0**

You write an **honest, evidence-based review of how Claude did on one task**, show it to the developer, and send it to the timesheet **only if they say Submit**. The report answers fixed questions, so tasks can be compared over time and the skills and rules can be improved.

## Where this sits in the flow

```
/start-task <ID>          → task.json, branch, log.jsonl
/kodion-create-spec <ID>  → spec
plan mode                 → plan
implement
/ship                     → commit, push, PR … then runs THIS SKILL as its last step
/task-feedback <ID>       → THIS SKILL, also by hand: to resend or regenerate
```

It works in **any project, whatever the stack** (Node, React, Next.js, PHP, Laravel, ColdFusion…). It reads only Claude's own session transcript, the files in `.claude/tasks/<ID>/`, the spec and plan, and `git`. It never reads or changes project code.

## Hard rules

1. **Files you may write:** `.claude/tasks/<ID>/feedback.json` only. The scripts write their own files in `.claude/tasks/<ID>/`. Change nothing else: no code, no spec, no plan, no `task.json`, no `log.jsonl`, no git commands that change anything.
2. **Nothing is sent without an explicit "Submit"** from the developer in this run. Silence, "looks good" and "ok" are not Submit. Only the Submit options in Step 6 count.
3. **Never send what the developer typed.** `feedback-work/prompts.tsv` is for you to read and classify. Only counts and your own one-line notes go into `feedback.json`. No code, diffs, file contents, keys, emails or personal names.
4. **Never read, print or ask for the Kodion key.** The scripts find it themselves.
5. **Be honest, not kind.** Every verdict needs evidence: a count from the script or a fact from a file. If something can't be measured, say `null` and "not measured". Never guess a number.
6. **A failure here never blocks the ship.** If anything fails, say so in one line, keep `feedback.json` locally, and stop. The developer can run `/task-feedback <ID>` later.
7. All file formats and score rules are in [references/feedback-schema.md](references/feedback-schema.md). Read it before Step 4.

---

## Step 0: Find the task

- **ID:** take it from `$ARGUMENTS`, without a leading `#`. If it's empty, take it from `git branch --show-current`: the digits after the `/` in `<type>/<ID>-<slug>`. If there are still no digits, ask for the task number in one AskUserQuestion.
- Glob `.claude/tasks/<ID>/task.json`. If it's missing, stop: *"No task file for <ID>, so there's nothing to review. Feedback only works for tasks started with /start-task."* When /ship called you, end silently instead: say nothing, and /ship's own report stands.
- Read `task.json`. Note `branch`, `base` (default `main`), `spec`, `plan` and `started_at`.

## Step 1: Collect the facts

Run from the project root:
```
bash .claude/skills/task-feedback/scripts/collect-metrics.sh <ID>
```
- `OK collected`: the printed JSON holds the counts. The work files are listed in `work_files`.
- `ERROR NO_TRANSCRIPT` or `ERROR PARSE`: carry on with Steps 2–3 using only the spec, plan, git and `log.jsonl`. Set every transcript-based field to `null`, and say "session transcript not found" in the summary.
- **Project-specific checks:** if the project has a CLAUDE.md with a **Commands** / lint / test section, and its check commands aren't in the built-in list (`npm test`, `phpunit`, `php -l`, `artisan test`, `pytest`, `jest`, `vitest`, `eslint`, `tsc`, `go test`, `cargo test`, `dotnet test`, `rspec`, `testbox`…), re-run once with them added, lowercase, as a regex: `TF_CHECK_PATTERNS='cfcompile|my-check' bash .claude/skills/task-feedback/scripts/collect-metrics.sh <ID>`.

Then Read the work files:
- `prompts.tsv`: phase, time, and the developer's message (trimmed)
- `questions.tsv`: questions Claude asked, by phase
- `checks.tsv`: check and test runs, PASS or FAIL, in order
- `failed.tsv`: commands that failed
- `edits.tsv`: files edited, by phase

## Step 2: Classify the developer's prompts

Label each line of `prompts.tsv` as exactly one of these:

| Label | Meaning | Examples |
|---|---|---|
| instruction | Gives the work or new information | "/start-task 164", "here is the screenshot", "add this too" when it's new scope from the developer |
| answer | Replies to something Claude asked | "use 3 cards", "yes, the green one" |
| approval | Moves the flow on | "approve", "looks good, go ahead", "ship it" |
| **correction** | Claude did something wrong and must fix it | "that's not what I asked", "you broke the header", "still wrong", "undo that" |
| **redirect** | Stops or changes Claude's direction mid-work | "stop, do X instead", "don't touch that file", "wrong approach" |

`corrections.repeated` is true when there were 2 or more corrections, or 2 or more redirects, about the same thing.

## Step 3: Check the spec, plan and changed files

**Spec:**
- Path is `task.json.spec`; otherwise Glob `.claude/specs/<ID>-*.md`, then `.claude/spec/<ID>-*.md`.
- Compare its `##` headings with the template. Use `.claude/skills/kodion-create-spec/templates/spec-template.md` if it exists; otherwise only check that the spec has a goal, scope, acceptance criteria and a verification list.
- Note `approved`: the header says `Status: Approved`, or `review_spec` is in `log.jsonl`.
- `revisions` = `workflow_log.save_spec` − 1, with a minimum of 0.

**Plan:**
- Path is `task.json.plan`; otherwise Glob `.claude/plans/<ID>-*.md`, then a plan file with the same name as the spec.
- **Required sections:**
  - If the project has `.claude/rules/planning.md`, use its "Every plan states" list.
  - Otherwise, check for these:
    - files to change
    - files to create
    - files not changed
    - ordered steps with checks
    - what must keep working
    - verification
- `revisions` = `session.plan_mode.rejected`.

**Scope:**
- Run `git diff --name-only <base>...HEAD`. If the branch was already merged and deleted, use `git log --oneline -20` to find the merge and diff that instead.
- Compare the result with the file paths named in the plan:
  - `outside_plan` = changed files the plan never mentions. Ignore task bookkeeping the project's rules require, such as `ai/INDEX.md` or a changelog, when the rules say to update it.
  - `planned_not_changed` = files the plan lists that were never changed.

## Step 4: Answer the six questions and score

Follow [references/feedback-schema.md](references/feedback-schema.md) exactly.

1. **Errors or rework during implementation?**
   - `failed_commands`: use `failed_commands.implement` from the script, after dropping failures that aren't errors. Read `failed.tsv` for that: a `grep` with no match or a `test -f` that was false are not errors.
   - `re_edited_files`: the files edited again after a failure, taken from `edits.tsv` and `checks.tsv`.
   - `rejected_edits`: from the script.
2. **How many implementation iterations?** `count` = 1 + the number of fix rounds. A fix round is a check that went from FAIL to PASS (`checks.fix_cycles`), or a correction that led to more edits. Fill `by_step` from `workflow_log`.
3. **Did Claude ask clarifying questions?** Use the script's `questions` counts. `after_approval` = questions in the implement and ship phases. `topics` = short paraphrases from `questions.tsv`.
4. **Did the developer correct or redirect Claude repeatedly?** Use your labels from Step 2, plus `interrupts` and `rejected_tool_calls`.
5. **Were tests run, and were failures resolved?**
   - `run` = `checks.runs` > 0.
   - `first_failed` = `checks.first_status` is `FAIL`.
   - `final_passed` = `checks.unresolved` is 0.
   - `commands` = short names of the checks, not full command lines.
   - `unresolved` = which ones still fail.
6. **Issues, risks, improvements:** at most 5 each, the most useful first.
   - **Issues** are things wrong or missing in what was delivered, measured against the spec.
   - **Risks** are things that could break elsewhere: global CSS, shared components, migrations, auth.
   - **Improvements** are concrete changes to the skills, rules or templates that would have avoided a problem in this task. These are the most valuable part, so be specific.

Then set `scores`, `one_shot` and `summary` using the rules in the schema file.

## Step 5: Write and show the report

1. `date -Iseconds` → `generated_at`.
2. Write `.claude/tasks/<ID>/feedback.json` with the Write tool. Include every key, and set `developer` to `{"rating": null, "comment": null}`. Read the `version` lines in `task-feedback/SKILL.md` and `kodion-create-spec/SKILL.md` for `skill_versions`.
3. Run `bash .claude/skills/task-feedback/scripts/post-feedback.sh <ID> --check`. On `ERROR BLOCKED`, remove the flagged text from `feedback.json` and run the check again.
4. Show the report in this shape, and nothing more:

```
📋 Task #<ID> feedback  (session <duration> min · <total> developer prompts)

Scores     Spec <n>/5 · Plan <n>/5 · Implementation <n>/5 · One shot: <Yes|No>

Spec        <format ok | missing: …> · <revisions> revision(s) · <approved|not approved>
Plan        <complete | missing: …> · <revisions> revision(s)
Rework      <Yes|No> — <note>
Iterations  <count> — <note>
Questions   <total> (spec <n> · plan <n> · after approval <n>) — <note>
Corrections <n> corrections · <n> redirects · <n> interrupts — <note>
Tests       <run: commands | not run> · first run <passed|failed> · final <passed|N unresolved>
Scope       <n> files · outside plan: <list or none> · planned but unchanged: <list or none>

Issues        • …
Risks         • …
Improvements  • …

<summary>
```

## Step 6: Ask before sending

Ask in **one** AskUserQuestion: *"Send this feedback to task #<ID> on the Timesheet?"*
- **Submit** (recommended)
- **Add my rating and comment, then submit**
- **Don't submit** (keep it on this machine only)

If they chose **Add my rating and comment**, ask one more AskUserQuestion with two questions:
- **Rating** (single select): `5 – Excellent` · `4 – Good` · `3 – OK` · `2 – Poor`. They can type 1 through "Other".
- **Comment**: options `No comment` and `Same as the summary`, and they type their own through "Other".

Edit `developer` in `feedback.json`. Keep the comment exactly as written, trimmed to 1,000 characters. Then re-run the `--check` from Step 5.3.

If they chose **Don't submit**, reply with one line, *"Kept locally: .claude/tasks/<ID>/feedback.json. Run /task-feedback <ID> to send it later."*, and stop.

## Step 7: Send

```
bash .claude/skills/task-feedback/scripts/post-feedback.sh <ID>
```
- `OK feedback saved on task #<ID>`: reply *"✅ Feedback saved on task #<ID>."*
- `ERROR …`: reply with one plain line saying what went wrong, using the script's message, and *"It's saved locally; run /task-feedback <ID> to resend."* Never paste the raw server reply.

## Running it again (`/task-feedback <ID>` by hand)

If `.claude/tasks/<ID>/feedback.json` already exists, first ask in one AskUserQuestion:
- **Resend the saved feedback** (recommended, if `feedback.status.json` says `"posted":false`): go straight to Step 7.
- **Regenerate it**: start from Step 1. The developer's rating and comment from the old file are kept unless they change them.
- **Cancel.**
