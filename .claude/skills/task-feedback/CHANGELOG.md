# Changelog

## 1.2.0 — 2026-10-22 · Matches create-spec v2.4.0

- **The approver check is gone.** Approval has no role gate any more, so a Medium or High-risk
  spec approved by whoever reviewed it is not an issue. Only an **unapproved** spec is.
- **New review-layout check:** the report says whether Part A has the `AT A GLANCE` box and how
  many drawings it holds. A missing box, or more than one drawing, is listed as an issue.

## 1.1.0 — 2026-10-21 · Works with small specs and the updated skills

- **Small specs** (kodion-create-spec v2.2): compared with `spec-small.md`, and their short plans need only files and checks. They're no longer marked "wrong format" or "incomplete".
- **Approver check:** a Medium or High-risk spec approved by a developer is listed as an issue.
- **Unsent Task Board ticks** (from `log.jsonl`) are listed as an issue, with the resend command.
- **`skill_versions`** now lists all four skills.
- The report shows its own version, the spec format, and who approved.
- No change to `feedback.json`'s keys, so the Timesheet endpoint doesn't change.

## 1.0.0 — 2026-10-16
- First version.
  - **Two scripts:** `collect-metrics.sh` counts what happened in the transcript, and `post-feedback.sh` scans for secrets and sends the report.
  - **The report:** answers six fixed questions, with scores for the spec, plan and implementation.
  - **Sending:** only after the developer chooses Submit, with an optional rating and comment.
