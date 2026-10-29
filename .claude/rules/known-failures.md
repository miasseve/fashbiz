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
| Linting (`npm run lint` **and** `npx eslint`) | Two pre-existing breakages, unrelated to any task: (1) the `lint` script is `next lint`, which Next.js 16 removed — it is parsed as `next <dir>` and errors "Invalid project directory ... \lint"; (2) running ESLint directly also fails because `eslint-config-next` loads `@typescript-eslint/parser`, which needs the `typescript` module — not installed in this JS-only project ("Cannot find module 'typescript'"). Net: lint cannot run in this environment by any route. Use `npm run build` as the compile check instead. | 2026-10-27 (found on #448) | migrate `lint` to the ESLint CLI and either add `typescript` as a devDep or drop the TS override from the ESLint config |
| Production build (`npm run build`, Turbopack) on this low-RAM host | Crashes before finishing, in Turbopack's CSS pipeline (`src/app/globals.css` via PostCSS) — observed as a segfault (exit 139) and as "JavaScript heap out of memory" / "Zone Allocation failed" (exit 1). Not caused by app code; it's the host running out of memory even with `NODE_OPTIONS=--max-old-space-size=8192` (that flag sizes the V8 old space, not Turbopack's native workers). So on this machine there is currently **no** working local compile check (lint is broken too). Run the compile check on a higher-RAM machine, or rely on Vercel's build. | 2026-10-29 (found on #538) | build on a higher-RAM dev box or in CI; or evaluate the non-Turbopack build / raising the host's RAM/swap |

<!--
Example rows — delete these once you add real ones:

| `capture boundary copy` (test/client_capture_test.dart) | Copy changed on the Task Board, test not updated | 2026-10-20 | task #399 |
| `backend route assertion` (test/api_routes_test.dart) | Points at the old staging URL | 2026-09-11 | accepted; staging is being retired |
-->

**Nothing listed?** Then every failure is real — which is the goal. Delete the empty row and leave
this file in place.
