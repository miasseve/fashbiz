# Lessons learned

Part of the `kodion-create-spec` skill. Read in Step 1. Lessons that apply are copied into the spec's §12.

**Why it exists:** each time a tester finds something a spec missed, we add one line here, so no spec misses it again.

**Rules**
- "Never push, merge, deploy or open a PR" is already built into every spec's §12, so it isn't listed here.
- **A person adds lessons. The skill never edits this file.**
- One line per lesson: what to check, and where it came from.
- A project can keep its own extra lessons in `.claude/rules/lessons-learned.md`, in the same format. The skill reads both.

| # | Lesson | Came from |
|---|---|---|
| L1 | If a value can be edited, check it **everywhere** it shows, after each step, **including the completed / history view**. | Estimate edit bug |
| L2 | A new status or type needs its **own colour, badge, filter option and legend entry**, and its label must **not repeat** in the text next to it. | "Waiting" status |
| L3 | Keep checks **small for Small tasks**: one check per place the change appears. A simple colour fix once took about an hour because its checks were sized for a big task. | Colour fix |
| L4 | A bug fix must find the **real cause** and fix it at the source, not patch one screen. | Repeated bug reports |

## Adding a lesson

Add a row at the bottom:

```
| L5 | <what every spec must check, in one line> | <task or bug it came from> |
```
