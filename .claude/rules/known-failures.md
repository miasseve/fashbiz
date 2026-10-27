# Tests that already fail

Tests in this project that fail **before any task starts**. They are not your problem.

**Why this file exists:** without it, every task re-investigates the same failures and explains
them again in the spec. On one task that cost four separate write-ups of the same six tests.

**How the skills use it:**

- Plan mode reads this file before running checks.
- A failure listed here is expected: don't investigate it, don't fix it, and write "same as the
  known-failures list" in §13 and §14 instead of explaining it again.
- A failure **not** listed here is real. Fix it, or stop and say so.
- Found one that already failed before your change and isn't listed? Add a line here, so nobody
  triages it twice.

**Keep it honest.** This is a list of known problems, not a place to hide new ones. Anything here
should have a follow-up task, or a note saying why it's accepted.

---

| Test | Why it fails | Since | Follow-up |
|---|---|---|---|
| | | | |

<!--
Example rows — delete these once you add real ones:

| `capture boundary copy` (test/client_capture_test.dart) | Copy changed on the Task Board, test not updated | 2026-10-20 | task #399 |
| `backend route assertion` (test/api_routes_test.dart) | Points at the old staging URL | 2026-09-11 | accepted; staging is being retired |
-->

**Nothing listed?** Then every failure is real — which is the goal. Delete the empty row and leave
this file in place.
