# Test cases for `/kodion-create-spec`

Run each test in a real project. Tick **Pass** only if every point in "Pass if" is true.
Record anything odd in the **Notes** column and send it back for fixing.

## A. Spec creation

| # | Run | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 1 | `/kodion-create-spec 01 \| Footer text colour \| Change footer text to grey` | Size Small · Risk Low. About 30 lines in §1–§11, and the other headings say `N/A: Small task`. At most 1 question. | | |
| 2 | `/kodion-create-spec 02 \| Testimonial section \| Add customer quotes below Pricing that rotate` | Looks like `examples/example-spec.md`: Parts A, B and C, with B and C folded. Part A is about 60 lines or less. No file names, tech stack or commands in §1–§11. §13 is empty headings. | | |
| 3 | `/kodion-create-spec 03 \| Discount banner \| Show a discount banner` (vague) | Asks about the amount, who gets it and when it ends. Doesn't invent them. | | |
| 4 | `/kodion-create-spec KOD-4 \| Wrong booking time \| Booking sometimes shows the wrong time` (bug) | Type Bug fix. Branch starts with `fix/`. §11 has steps to reproduce. An AC proves it's fixed. | | |
| 5 | `/kodion-create-spec 05 \| Phone on profile \| Users can add a phone number` | Risk High. §4.1 present. §5 and §7 cover existing users without a phone. No table or column names. | | |
| 6 | `/kodion-create-spec 06 \| Delete accounts \| Admins can delete user accounts` | Risk High. §7 covers permissions, confirm step and undo. | | |
| 7 | `/kodion-create-spec 07 \| Online payment \| Add card payment at checkout` | Size Large · Risk High. §7 covers secrets, double charge and test mode. | | |
| 8 | `/kodion-create-spec 08 \| Payment button text \| Change "Pay" to "Pay now"` | Size Small · Risk **High**. §5 and §7 included even though it's Small. | | |
| 9 | Same task as test 2 in a Laravel project and in a React project | §1–§11 read the same in both. | | |
| 10 | `/kodion-create-spec` with no input | Asks for ID, name and description in one question. | | |
| 11 | Run test 2 again with the same ID and name | Stops and asks: overwrite, or save as `-v2`. | | |
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
| 20 | Count the lines of Part A in specs 1 and 2 | About 25 lines for the Small spec (test 1), about 60 for the Medium spec (test 2). | | |
| 21 | Open spec 2 in GitHub or VS Code preview | Parts B and C are folded. Each folded heading shows its count, e.g. "(19 acceptance checks)". | | |
| 22 | Check §7 of spec 2 | Only areas that apply have rows. All other areas are in the "Not involved" line, each with a reason. All 16 areas are accounted for. | | |
| 23 | Check the spec header and the skill's reply | Both show `v2.1.0`. | | |

## B. Safety of the skill

| # | Check | Pass if | Pass? | Notes |
|---|---|---|---|---|
| 24 | After any test in A | Only one new file, inside `.claude/specs/`. Only the `spec` field of `task.json` changed (task-file tests). No code changed. No branch created or switched. No commit. | | |
| 25 | During test 2, say "just build it" | The skill refuses and points to approval, then plan mode. | | |
| 26 | Say "approve" while a question blocks Planning | Refuses to approve, and names the blocking question. | | |
| 27 | Say "approve" with nothing blocking | Asks for name and role if unknown. Status → Approved, "Approved by" filled with name, role and date. Nothing else changes. | | |
| 28 | Say "approve" as a developer on a High-risk spec | Refuses, and says a senior (plus the client if business rules change) must approve. | | |

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

## Result

**Passed:** __ / 50 · **Tested by:** ______ · **Date:** ______ · **Project:** ______
