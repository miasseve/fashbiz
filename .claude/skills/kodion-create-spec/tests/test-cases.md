# Test cases for `/kodion-create-spec`

Run each test in a real project. Tick **Pass** only if every point in "Pass if" is true.
Record anything odd in the **Notes** column and send it back for fixing.

## A. Spec creation

| # | Run | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 1 | `/kodion-create-spec 01 \| Footer text colour \| Change footer text to grey` | **Small spec** (`spec-small.md` layout, like `examples/example-spec-small.md`). Part A about 55 lines, opening with the box. No questions, or at most 2. No builder subagent. | | |
| 2 | `/kodion-create-spec 02 \| Testimonial section \| Add customer quotes below Pricing that rotate` | Looks like `examples/example-spec.md`: Parts A, B and C, with B and C folded. Part A is about 70 lines or less. No file names, tech stack or commands in §1–§11. §13 is empty headings. | | |
| 3 | `/kodion-create-spec 03 \| Discount banner \| Show a discount banner` (vague) | Asks about the amount, who gets it and when it ends. Doesn't invent them. | | |
| 4 | `/kodion-create-spec KOD-4 \| Wrong booking time \| Booking sometimes shows the wrong time` (bug) | Type Bug fix. Branch starts with `fix/`. §11 has steps to reproduce. An AC proves it's fixed. | | |
| 5 | `/kodion-create-spec 05 \| Phone on profile \| Users can add a phone number` | Risk High. §4.1 present. §5 and §7 cover existing users without a phone. No table or column names. | | |
| 6 | `/kodion-create-spec 06 \| Delete accounts \| Admins can delete user accounts` | Risk High. §7 covers permissions, confirm step and undo. | | |
| 7 | `/kodion-create-spec 07 \| Online payment \| Add card payment at checkout` | Size Large · Risk High. §7 covers secrets, double charge and test mode. | | |
| 8 | `/kodion-create-spec 08 \| Payment button text \| Change "Pay" to "Pay now"` | Size Small · Risk **High**. §5 and §7 included even though it's Small. | | |
| 9 | Same task as test 2 in a Laravel project and in a React project | §1–§11 read the same in both. | | |
| 10 | `/kodion-create-spec` with no input | Asks for the task number in one question, and mentions `ID \| name \| description` for tasks outside the timesheet. | | |
| 11 | Run test 2 again with the same ID and name | Asks: update the existing spec, overwrite, or save as `-v2`. "Update" keeps §13 and §14, sets Draft, and notes that the plan must be updated. | | |
| 12 | `/kodion-create-spec 7 \| Invoice PDF export` (no task file) | ID becomes `07`. File is `.claude/specs/07-invoice-pdf-export.md`. Branch is `feature/07-invoice-pdf-export` (not created yet). Nothing is logged to the timesheet. | | |

## A2. Coverage, lessons and wording

| # | Run | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 13 | `/kodion-create-spec 09 \| Edit estimate \| Let users edit a task's estimate` | §4.4 lists every place the estimate shows (task card, pop-up, My Day, completed/history view, reports). Life covers edit, complete and refresh. Each row has an AC with real values ("2h → 3h"). Lesson L1 is in §12. | | |
| 14 | `/kodion-create-spec 10 \| Waiting status \| Add a Waiting status for tasks` | §4.4 C2 covers colour, badge, filter and legend. If the colour isn't known, it's asked in §10, not decided. Lesson L2 is in §12. | | |
| 15 | `/kodion-create-spec 11 \| Estimate and due date \| Let users edit the estimate and due date` | Both the estimate and the due date have their own requirement. Neither is dropped. | | |
| 16 | Attach a screenshot showing real customer names and phone numbers, then run the skill | The spec uses made-up names ("Customer A"). No real names or numbers anywhere. | | |
| 17 | Add a lesson L5 to the project's `.claude/rules/lessons-learned.md`, then run a task it applies to | L5 appears in §12. The skill doesn't edit any lessons file. | | |
| 18 | Run test 1 (footer colour) again | §4.4 has only "Where it appears", one row per place. No life or tester checklist (lesson L3). | | |

## A3. Review layout and version

| # | Run | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 19 | Give a reviewer only Part A of spec 2 | They can say the goal, every requirement, every AI decision and every open question without opening Part B. | | |
| 20 | Count the lines to review in specs 1 and 2 | Part A is about 55 lines for the small spec (test 1) and about 70 for the full spec (test 2) — and in both, the 8-row box alone answers the review. | | |
| 21 | Open spec 2 in GitHub or VS Code preview | Parts B and C are folded. Each folded heading shows its count, e.g. "(19 acceptance checks)". | | |
| 22 | Check §7 of spec 2 | Only areas that apply have rows. All other areas are in the "Not involved" line, each with a reason. All 16 areas are accounted for. | | |
| 23 | Check the spec header and the skill's reply | Both show `v2.6.0`. | | |

## B. Safety of the skill

| # | Check | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 24 | After any test in A | Only one new file, inside `.claude/specs/`. Only the `spec` field of `task.json` changed (task-file tests). No code changed. No branch created or switched. No commit. | | |
| 25 | During test 2, say "just build it" | The skill refuses and points to approval, then plan mode. | | |
| 26 | Say "approve" while a question blocks Planning | Refuses to approve, and names the blocking question. | | |
| 27 | Say "approve" on a Low-risk spec with nothing blocking | Approved straight away, **no questions**. "Approved by" = your `git config user.name`, with the date. Nothing else changes. | | |
| 28 | Say "approve" on a High-risk spec | Approved straight away too. **No senior question, no client sign-off, no role mentioned anywhere.** | | |

## C. Quality checks

| # | Check | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 29 | Read the "Quality check" block of test 2 | Score per area adds up to the total. Every blocker has ✅ / ❌ / N/A. | | |
| 30 | Every requirement with Source "AI" | Also listed in §9. | | |
| 31 | Every FR | Has at least one AC in §6. | | |
| 32 | Give spec 2 to a non-technical person | They can explain §1–§6 in their own words. | | |
| 33 | Edit a spec so an AC says "works properly", then ask the skill to re-check | Blocker B12 fails and the skill rewrites it with real values. | | |

## D. Plan mode and done report (after approving spec 2)

| # | Run | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 34 | Plan mode on the **Draft** spec: "Read .claude/specs/02-testimonial-section.md and follow §12" | Stops and says the spec isn't approved. | | |
| 35 | Same prompt on the **Approved** spec | Plan saved in `.claude/plans/`. §13 filled: project scan with proof, every layer, files, database row, every AC covered. §1–§11 untouched. | | |
| 36 | Plan mode on spec 2 in a project with no test runner | §13 says "none" for tests. Doesn't invent a test command. | | |
| 37 | After coding | §14 filled. Every AC has a result. Every ✅ has proof. Any file not in §13 is explained. | | |
| 38 | Spec for a task that says "fix and deploy" → approve → plan mode | §12 says never deploy. The plan has no push, merge, deploy or PR step. | | |
| 39 | Plan mode on the approved bug spec from test 4 | §13 names the real cause. The plan has a check that fails before the fix and passes after. | | |

## E. Flow with /start-task and the timesheet (v2.1.0)

Run `/start-task <n>` on a task you picked up first. "Logged" means `log.jsonl` has the line with `"posted":true` and the step has a green tick on the Task Board.

| # | Run | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 40 | `/kodion-create-spec 316` after `/start-task 316` | Name and description come from `task.json`. ID stays `316` (not padded). File is `.claude/specs/316-<slug from branch>.md`. Header branch = `task.json.branch` "(created by /start-task)". | | |
| 41 | Same, the first time for this task | Asks once whether the session was renamed. "Yes" logs `rename_session`. Running the skill again doesn't ask again. | | |
| 42 | Same, after the spec is saved | `write_spec` and `save_spec` logged once each. `task.json.spec` points to the spec. | | |
| 43 | Ask for one change | `save_spec` count goes to 2. `write_spec` stays 1. | | |
| 44 | Say "approve" | `review_spec` logged. Reply tells you to open plan mode. | | |
| 45 | `/kodion-create-spec 999` with no task file | Stops: "Run /start-task 999 first." No spec written. | | |
| 46 | Run it on `main` while task 316 is on `chore/316-…` | Stops and says which branch to switch to. | | |
| 47 | Task whose description only repeats the title (like #316) | Round 1 questions are asked (Scope and Done means), even for a Small task. | | |
| 48 | Turn off the network, then run test 42 | Spec is still saved. Reply shows "⚠️ save_spec not sent". Next run resends it (`--retry`) and the line becomes `"posted":true`. | | |
| 49 | Plan mode on the approved spec from test 44 | No new branch is created. After the plan is approved, `plan` is logged and `task.json.plan` is set. | | |
| 50 | Spec Type is Feature but the branch is `chore/…` | Branch is kept. §9 notes the mismatch. | | |

## F. Small and full tracks, approval, follow-ups (v2.2.0)

| # | Run | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 51 | `/kodion-create-spec 08 \| Payment button text \| Change "Pay" to "Pay now"` | **Full spec**, even though it's Small, because the Risk is High. | | |
| 52 | `/kodion-create-spec <ID> --full` on a footer colour task | Full spec, Parts A, B and C. | | |
| 53 | `/kodion-create-spec <ID> --small` on a "save phone number" task | Says in one line that `--small` doesn't apply to High risk, then writes a full spec. | | |
| 54 | A task that looks small but, while reading, turns out to save data | Switches to the full spec and says why in one line. | | |
| 55 | Time a small task from command to saved spec | A few minutes. No builder subagent ran. | | |
| 56 | A Medium-size, Low-risk full spec | No builder subagent (only Large or High risk get it). Score is shown. | | |
| 57 | Plan mode on an approved small spec | Short plan: files, one check per AC. Fills the small §13. | | |
| 58 | Plan mode on a small spec whose code turns out to touch saved data | Stops and says: run `/kodion-create-spec <ID> --full`. | | |
| 59 | `/kodion-create-spec 316` after task 316 was shipped and its branch deleted | Stops: the task looks finished; create a new task and run `/start-task <new number>`. | | |
| 60 | New task whose description says "Follow-up to #316" | Header **Follows: #316**. The spec doesn't repeat what #316 already delivered. | | |
| 61 | Ask for a change on an approved, not yet shipped spec | Status goes back to Draft, and it needs approving again. | | |
| 62 | Run `/kodion-create-spec 316` again when its spec exists, and pick "Update the existing spec" | Same file is edited. §13 and §14 kept. Status Draft. `save_spec` logged, `write_spec` not. | | |
| 63 | Type `approve for Ravi` on a High-risk spec | No question. "Approved by" = `Ravi (passed on by <your git name>)`. No role is recorded. | | |

## G. Review layout and visuals (v2.4.0)

| # | Check | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 64 | Any spec from any test above | Part A opens with an `AT A GLANCE` box: 8 rows (Goal · Changes · Won't · Keep · Danger · Size · Needs · Verdict), none blank, plain words, real values, 69 characters wide. | | |
| 65 | A spec with a question that blocks Planning | The box's **Verdict** row says `Blocked by Q<n>`, never "Ready to approve". | | |
| 66 | Count the drawings in Part A of any spec | **One at most**, besides the box. None is fine. Nothing drawn in Part B or Part C. The box itself is never a Mermaid block. | | |
| 67 | A spec whose Part A has a drawing | The drawing replaces text — the same thing isn't also written in a sentence beside it. If it's the places list, §4.4 in Part B has only the stages and the checklist. | | |
| 68 | Measure Part A | About 55 lines for a small spec, about 70 for a full one, and §1–§3 is two lines rather than a table. Longer means prose or repetition crept in. | | |
| 69 | A spec in a project that is **not** a git repo | Header says `Branch: none (no git set up)`. No git command was run, no §10 question about setting git up, and no mention of `git init`. The reply adds one line saying `/ship` won't work yet. | | |
| 70 | The end of Part A | The reply line is there: `approve` · `D<n> change: …` · `Q<n>: <answer>`. A full spec also has the "Not sure? Open Part B" line; a small spec correctly has only the first. | | |

## I. Mermaid drawings (v2.5.0)

| # | Check | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 80 | A spec whose task is a flow change, with no `.claude/spec-visuals` file | Part A has a ```mermaid block (`graph LR`) **and** a plain-text copy under it. If Step 3 asked questions, one of them asked whether the team's preview renders Mermaid, and offered to save the answer. | | |
| 81 | Put `mermaid` in `.claude/spec-visuals`, write another spec | The Mermaid block only — **no** text copy. Nothing asks again. | | |
| 82 | Put `mermaid+text` in `.claude/spec-visuals`, write another spec | Mermaid block plus the text copy. Nothing asks again. | | |
| 83 | With `mermaid-ascii` installed | The text copy matches `mermaid-ascii -f <file>.mmd -x 2 -y 1 --max-width 70` for the same source — it was generated, not hand-drawn. | | |
| 84 | With `mermaid-ascii` **not** installed, and a text copy wanted | The copy is hand-drawn, within 70 characters and 14 lines, and the reply says once that installing the tool keeps the two in step. The spec is still saved. | | |
| 85 | Open the spec in VS Code preview (Markdown Preview Mermaid Support installed) | The diagram renders as boxes and arrows. The At a glance box above it is still plain text. | | |
| 86 | A task that is a journey across people or systems | `sequenceDiagram`, at most 3 actors and 3 messages, every label 2–3 words, 14 lines or fewer. | | |
| 87 | Ask for a diagram with a diamond or rounded shape, or a class diagram | Refused — rectangles only, because the text renderer can't draw the rest. Blocker B14. | | |

## H. Attachments and no-git logs (v2.4.0)

| # | Check | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 71 | `/start-task` on a task that has screenshots on the Task Board | Files land in `.claude/attachments/`, `task.json` lists each with `path` and `status`, and the reply's `Files:` line counts them. No key was sent with the download. | | |
| 72 | `/kodion-create-spec <ID>` on that task | Each `status: "ok"` file is opened with Read. Header **Based on** lists them by path. §11 **Attachments** says in one line what each shows. No real name, email or phone number from the images appears anywhere in the spec. | | |
| 73 | A task whose only real content is a screenshot (empty description) | Round 1 questions are asked, and they point at what the image shows. If a drawing is used, it's the output preview, drawn from the screenshot. | | |
| 74 | A task with a video, or a `.docx` attachment | The video is a link only, the `.docx` is `skipped`, and each becomes one §10 question. Neither is downloaded or guessed at. | | |
| 75 | `/start-task <ID>` on a project with **no git** | Reply shows `Branch: none` and `pull_latest ⊘ · create_branch ⊘` with `⊘ = not ticked: no git set up`. `log.jsonl` has a `"skipped"` line for each. **Nothing was posted for them.** `start_session` posted normally. | | |
| 76 | `/ship` on that project | It stops, ticks nothing, lists the 5 Ship steps as not ticked with the reason, prints the workflow log showing `9 of 16 ticked`, and gives the `git init` → commit → `/start-task` steps. No file was copied, moved or deleted. | | |
| 77 | `log-step.sh <ID> --retry` after test 75 | `OK nothing to resend` — a skipped step is never resent. | | |
| 78 | Set git up on that project (`git init` + first commit), then `/start-task <ID>` again | It says the project is on git now, creates the branch, sets `"vcs": "git"` in `task.json`, and posts `pull_latest` and `create_branch` with **count 1 each**. `start_session` is **not** resent (its count stays 1). | | |
| 79 | `/ship` after test 78 | Works normally and ticks all 5 Ship steps. The workflow log ends at 16 of 16. | | |

## J. Speed and cleanup (v2.6.0)

| # | Check | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 88 | Write a small spec and count the files Claude opened | Only `templates/spec-small.md` and `references/visuals.md` from the skill. **Not** `quality-rules.md`, `risk-matrix.md`, `safety-checklist.md`, `coverage-checklist.md`, the full template or the full example. | | |
| 89 | The saved small spec, Part C | Four short lines: a pointer to the Small section of `.claude/rules/plan-mode.md`, the task table, the §13/§14 notes, and `Blockers: none`. **No copied plan instructions, no empty tables.** Whole spec is about 90 lines, not 170. | | |
| 90 | During the small spec, watch which project files are read | The task text and its attachments, `CLAUDE.md` and locked areas — **no source file is opened**. §11 reads like something a user would say, not like code. | | |
| 91 | Plan mode on that spec | It reads `.claude/rules/plan-mode.md`, finds the code itself, and fills §13 with the plan path, the stack and the acceptance-check table only — **no second copy of the file list or change list.** | | |
| 92 | A task where Claude wants to add something it can't verify here (e.g. "text stays readable", no simulator) | It appears in **§10 as a question**, not in §4.3 as a requirement. No acceptance check is written that will end as ⏸. | | |
| 93 | A spec where one check covers nothing | Blocker B1 fails it. Every check's "Covers" column names a requirement, or the box's "Keep" row. | | |
| 94 | `/start-task` on a task with 3 screenshots | They land in `.claude/attachments/` as `<ID>.png`, `<ID>-2.png`, `<ID>-3.png`. **No `.claude/tasks/<ID>/attachments/` folder is created.** `.claude/attachments/` is in `.gitignore`. | | |
| 95 | `/start-task` from the base branch with uncommitted work | **No pending-work menu.** One line says the changes come along to the new branch. The menu still appears when the same thing happens on an unrelated branch. | | |
| 96 | `/ship` on a small task | Step 9b runs the project's checks once after the merge; a failure listed in `.claude/rules/known-failures.md` is reported as "same as the known-failures list". Step 10 deletes only this task's files from `.claude/attachments/`, and says so. | | |

## Result

**Passed:** __ / 96 · **Tested by:** ______ · **Date:** ______ · **Project:** ______
