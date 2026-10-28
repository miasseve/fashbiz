# Instructions for plan mode

Every spec's §12 points here instead of carrying its own copy. Read the section that matches the
spec's track, then do what it says. The spec's §12 gives you only what changes per task: the task
ID, the plan file path, the type, and the lessons that apply.

**Both tracks, always:**

1. **Stop if the spec's Status is not `Approved`**, or if any question in §10 blocks "Planning".
2. **Never commit, push, merge, deploy or open a PR**, even if the task says so. `/ship` does that.
3. **Branch.** Read the spec header's Branch field:
   - *"created by /start-task"* → you're already on it. Check with `git branch --show-current`, and **never create another branch**.
   - *"not created yet"* → create it only after plan approval, and only after the developer confirms.
   - *"none (no git set up)"* → the project isn't on git. Skip every git command, and don't plan a commit, push or merge; `/ship` can't run until git is set up.
4. **Never write "Pass" without proof** in the done report.
5. **Timesheet logging** (only when the spec header names a task file; skip for manual tasks). Run each once, at the moment it becomes true:
   ```
   bash .claude/skills/start-task/scripts/log-step.sh <ID> plan        # plan approved and saved
   bash .claude/skills/start-task/scripts/log-step.sh <ID> implement   # code written and reviewed
   bash .claude/skills/start-task/scripts/log-step.sh <ID> validate    # §14 filled, every check proven
   bash .claude/skills/start-task/scripts/log-step.sh <ID> iterate     # each round of fixes after validation
   ```
   Also set `"plan": ".claude/plans/<file>"` in the task file once the plan is saved. If a log prints
   `ERROR`, report it in one line and carry on.

---

## Which tests to run

**This is where most of the time goes on a small task, so get it right.**

1. **Find the project's own checks** (lint, type check, build, tests) from its config and scripts.
   Never invent a command. If a check doesn't exist, write "none".
2. **Read `.claude/rules/known-failures.md`** if it exists. It lists tests that already fail, and
   why. Those are **not** your problem: don't investigate them, don't fix them, and don't explain
   them again in §13 or §14 — write "same as the known-failures list".
3. **Small spec:** run only the test file(s) covering what you changed, plus lint. The full suite
   runs once at `/ship`.
   **Full spec:** run the full suite before and after, as the project defines it.
4. If a test fails that is **not** in the known-failures list, that's a real failure. Fix it or stop
   and say so.
5. **Found a test that already failed before your change and isn't listed?** Add it to
   `.claude/rules/known-failures.md` with one line saying what it is, so nobody triages it again.

---

## Small spec

Keep the plan short: the files to change, one check per acceptance check, nothing else.

1. **Stop if it's bigger than the spec says.** If the code shows saved data, login or permissions,
   money, personal data, more than one screen, or more than about 3 files, stop and say:
   *"This needs a full spec. Run `/kodion-create-spec <ID> --full`."* Don't plan and don't code.
2. **Read only what this change touches.** The spec's §11 describes what a user sees; your job is
   to find the code behind it. Stop reading once you can name the files to change. Don't scan the
   project.
3. Follow **"Which tests to run"** above.
4. Write the plan to `.claude/plans/<ID>-<slug>.md`: the files to change, what changes in each, and
   one check per acceptance check.
5. Fill **§13** in the spec — only these three things:
   - the plan file's path
   - the tech stack, and "Still small? yes / no, because …"
   - the table mapping each acceptance check to how it was proven

   **Don't repeat the plan.** The file list and the change list live in the plan file only.
6. Ask for approval of the plan before coding.
7. After coding, fill **§14** (the done report) in the spec.

---

## Full spec

1. **Required for the spec's Risk level:** copy the checks for that level from the spec skill's
   `references/risk-matrix.md`, section 3. If the code scan shows more danger, raise the Risk,
   explain why in §13, and follow the higher level's checks.
2. **Detect the tech stack** from the project's own files (React, Laravel, Flutter, or a mix). Read
   the project rules and design guide, the code behind §11, and what depends on it. Record the
   findings in §13 with proof.
3. Follow **"Which tests to run"** above.
4. **Plan every layer this stack needs.** Cover each heading, or write "N/A" with a reason:
   - Frontend: screens, states, accessibility
   - Backend: logic, validation, permissions
   - Data: database, migrations, existing records, backup
   - Security: input checks, output safety, secrets, access control
   - Integrations: APIs, third-party services
   - Testing: automated tests if the project has a runner, otherwise browser or manual checks
   - Release: settings, deploy steps, rollback
5. Write the full technical plan to `.claude/plans/<ID>-<slug>.md`.
6. The plan maps every acceptance check (§6), every place and stage in §4.4, and every row in §7
   (areas that apply) to a task and a check.
7. Write exact behaviour. "Add error handling" or "handle edge cases" is not allowed.
8. If anything must stay the same, capture a "before" baseline (screenshots, test results) first.
9. Fill **§13** with the summary of the plan: the plan path, the project scan with proof, the layer
   table, the database/API/settings/libraries/permissions rows, and the acceptance-check table.
   **Don't copy the plan's file list and change list** — those live in the plan file.
10. Ask for approval of the plan before coding. Don't start coding while any §10 question blocks
    "Coding".
11. After coding, fill **§14** (the done report).

**Before asking for plan approval, check:**
- [ ] Every finding in "Project scan" has proof (a file or command)
- [ ] Every layer is covered, or N/A with a reason
- [ ] Every acceptance check, every place and stage in §4.4, and every row in §7 is mapped to a task and a check
- [ ] Every lesson named in the spec's §12 is applied
- [ ] No step creates a second branch, commits, pushes, merges, deploys or opens a PR
- [ ] Database, data, API, settings, libraries and permissions each have a row, none blank
- [ ] The Risk level's required checks are in the plan
- [ ] Any Risk change is explained

---

## What each task type needs

The spec's §12 names one of these. Apply it.

| Type | What it means for the plan |
|---|---|
| **Feature** | Reuse existing parts (components, messages, patterns) before making new ones, and name them in §13. If it adds or changes an API, list in the plan: request, success and error responses, who can call it, input checks, and the app's existing error format. |
| **Bug fix** | Find the real cause and fix it at the source, not on one screen. Check every place in §4.4. Add a check that fails before the fix and passes after. |
| **Refactor** | Nothing a user can see changes. Compare "before" and "after" screenshots and check results. |
| **Chore** | Nothing a user can see changes, unless the spec's summary says so. |

---

## Filling the done report (§14)

- Every acceptance check is ✅, ❌ or ⏸ — none missing. **Key:** ✅ Pass · ❌ Fail · ⏸ Not tested yet (give the reason).
- Every ✅ has proof: a command's output, a screenshot, or a test name. "Pass" without proof counts as ⏸.
- Every file you changed that isn't in §13 is explained.
- Anything different from the plan, or not done, is listed with a reason.
- Test results: "same as the known-failures list" when nothing new broke. Don't re-explain known failures.
- High risk: backup and rollback test have proof.
