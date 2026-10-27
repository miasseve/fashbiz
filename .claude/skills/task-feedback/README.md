# Kodion – Task Feedback

**Version 1.2.0** · see [CHANGELOG.md](CHANGELOG.md)

The last step of the Kodion spec-driven flow. After `/ship`, Claude reviews how the task's session went and writes a short report. The developer confirms it, and only then is it saved on the task in the Kodion Timesheet.

The report answers the same questions for every task:

- Was the spec in the right format, and approved?
- Was the plan complete?
- Were there errors or rework during implementation?
- How many implementation iterations were there?
- Did Claude ask clarifying questions, and when?
- Did the developer have to correct or redirect Claude, and how often?
- Were tests run, and were the failures fixed?
- What issues, risks or improvements were found?

## What's inside

```
task-feedback/
├── SKILL.md                      What Claude does, step by step
├── README.md                     This file
├── CHANGELOG.md
├── references/
│   └── feedback-schema.md        The exact feedback.json shape and the scoring rules
└── scripts/
    ├── collect-metrics.sh        Counts prompts, questions, failures, checks, edits from the session transcript
    └── post-feedback.sh          Secret scan, then POST to the timesheet (only after "Submit")
```

## Install

It needs `/start-task`, which writes the `task.json` and `log.jsonl` this skill reads.

1. Unzip the package in the **project root**, so you get `<project>/.claude/skills/task-feedback/`.
2. In `/ship`'s `SKILL.md`, add this as the last step:
   > **Final step: task feedback.** If the branch name has a task number and `.claude/tasks/<ID>/task.json` exists, run the `task-feedback` skill with `<ID>`. Otherwise skip this step without mentioning it.
3. Restart Claude Code. Type `/` and check that `task-feedback` appears.

It uses the same Kodion key as `/start-task` (`KODION_KEY` in `.claude/settings.local.json`), so there's nothing new to set up.

## Works in any project

The scripts read only Claude Code's own session transcript (`~/.claude/projects/<project>/*.jsonl`), the task files and `git`. They never read project code, so the same package works for Node, React, Next.js, PHP, Laravel, ColdFusion and anything else. They need only `bash`, `awk`, `grep` and `curl`, the same as `/start-task`. On Windows, Git Bash provides all four.

- **Check commands:** common test, lint and build commands are recognised automatically. If a project has its own, the skill reads them from that project's CLAUDE.md and passes them in as `TF_CHECK_PATTERNS`.
- **Transcript folder:** found automatically. To point at another folder, set `TF_TRANSCRIPT_DIR`.
- **Local test server:** set `KODION_API_URL=http://127.0.0.1:8000/api/dev-workflow/tasks`.

## Privacy

- **What the developer typed is never sent.** It's read on the machine and turned into counts: instructions, answers, approvals, corrections, redirects.
- **Nothing is sent without "Submit".**
- **`post-feedback.sh` scans for secrets first.** If the file contains anything that looks like a key, token or password, or the developer's own Kodion key, it refuses to send.

## Server side

The skill sends `POST /api/dev-workflow/tasks/<ID>/feedback` with `Authorization: Bearer <key>`. The body is `feedback.json`, described in [references/feedback-schema.md](references/feedback-schema.md).

The endpoint follows the same rules as `/logs`:
- **Who can send:** only the developer who picked up the task.
- **Not found:** 404 when the task isn't theirs.
- **Bad data:** 422.

Until the endpoint exists on the timesheet, sending returns a 404. The feedback is kept locally and can be resent later with `/task-feedback <ID>`.
