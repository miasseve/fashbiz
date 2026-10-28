# feedback.json: the exact shape

`/task-feedback` writes `.claude/tasks/<ID>/feedback.json` in this shape. `post-feedback.sh` sends the file as-is to `POST /api/dev-workflow/tasks/<ID>/feedback`. The timesheet stores it against the task.

Rules:
- Every key below is always present. If something is unknown, use `null`; if a list is empty, use `[]`. Never leave a key out.
- Every `note` is one plain sentence of at most 300 characters. Every list item is at most 200 characters. `summary` is at most 1,200 characters.
- **Never put in this file:** the developer's prompt text, file contents, code, diffs, keys, tokens, passwords, emails, or personal names. Use counts, file paths, and Claude-written descriptions only.
- File paths are relative to the project root, with forward slashes.

```json
{
  "schema_version": 1,
  "task_id": 164,
  "branch": "feature/164-testimonial-section",
  "generated_at": "2026-10-16T17:40:00+05:30",
  "skill_versions": { "start-task": "1.5.0", "kodion-create-spec": "2.6.0", "ship": "1.3.0", "task-feedback": "1.2.0" },

  "session": {
    "duration_minutes": 95,
    "transcript_files": 1,
    "human_prompts": { "total": 9, "spec": 3, "plan": 2, "implement": 3, "ship": 1 },
    "interrupts": 1,
    "rejected_tool_calls": 2
  },

  "scores": { "spec": 4, "plan": 5, "implementation": 3 },
  "one_shot": false,

  "spec": {
    "found": true,
    "path": ".claude/specs/164-testimonial-section.md",
    "format_ok": true,
    "missing_sections": [],
    "approved": true,
    "revisions": 1,
    "note": "Followed the template; one round of changes to the empty-state wording."
  },

  "plan": {
    "found": true,
    "path": ".claude/plans/164-testimonial-section.md",
    "missing_sections": ["What must keep working"],
    "revisions": 0,
    "note": "Complete file list and steps; no 'must keep working' list."
  },

  "rework": {
    "had_rework": true,
    "failed_commands": 2,
    "re_edited_files": ["resources/views/pages/home.blade.php"],
    "rejected_edits": 0,
    "note": "The first compile-lint failed on an unclosed @if; fixed in the same file."
  },

  "iterations": {
    "count": 2,
    "by_step": { "implement": 1, "validate": 2, "iterate": 1 },
    "note": "One build pass, then one fix round after the first check failed."
  },

  "questions": {
    "total": 4,
    "by_phase": { "spec": 3, "plan": 1, "implement": 0, "ship": 0 },
    "after_approval": 0,
    "topics": ["How many testimonials to show", "Autoplay speed"],
    "note": "All questions were asked before the plan was approved."
  },

  "corrections": {
    "human_prompts": 9,
    "corrections": 1,
    "redirects": 0,
    "interrupts": 1,
    "repeated": false,
    "note": "The developer corrected the card spacing once."
  },

  "tests": {
    "run": true,
    "commands": ["php -l", "blade compile-lint", "php artisan test"],
    "first_failed": true,
    "final_passed": true,
    "unresolved": [],
    "note": "The compile-lint failed once, then passed; the test suite passed."
  },

  "findings": {
    "issues": ["Carousel arrows have no aria-label"],
    "risks": ["The new CSS is global and also affects the About page"],
    "improvements": ["Add 'what must keep working' to the plan template checklist"]
  },

  "scope": {
    "files_changed": 4,
    "outside_plan": [],
    "planned_not_changed": []
  },

  "summary": "Spec and plan were solid. Implementation needed one fix round after a Blade compile error, and one spacing correction from the developer.",

  "developer": { "rating": null, "comment": null }
}
```

## Scores (1–5)

| Score | Spec | Plan | Implementation |
|---|---|---|---|
| 5 | Right template (small or full) followed, approved first time, no missing sections | Every required section, approved first time | One shot: no rework, no corrections, every check passed first time |
| 4 | One revision round **or** one minor missing section | One revision **or** one minor missing section | One fix round **or** one correction, all checks passed in the end |
| 3 | Two revisions, or a few missing sections | Two revisions, or a few missing sections | Several fix rounds or corrections, all checks passed in the end |
| 2 | Wrong format or major sections missing | Missing the file list or steps | Repeated corrections or redirects, or scope creep |
| 1 | No spec, or not approved | No plan file | Checks never run, or failures left unresolved |

Use `null` for a stage that didn't happen (for example, no spec because the task was manual). Don't score it 1.

## one_shot

`true` only when all of these are true:
- `rework.had_rework` is false
- `iterations.count` is 1
- `questions.after_approval` is 0
- `corrections.corrections` and `corrections.redirects` are both 0
- `tests.run` is true and `tests.first_failed` is false
