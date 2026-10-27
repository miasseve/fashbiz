# <Task name>

`<ID>` · <Feature | Bug fix | Refactor | Chore> · **Small spec** · Low risk — <one-line reason>
**Status:** Draft · <today> · **Approved by:** — · **Skill:** kodion-create-spec v<version>
**Task:** `.claude/tasks/<ID>/task.json` (or "manual, no timesheet task") · **Branch:** `<branch>` (<created by /start-task | not created yet | none (no git set up)>) · **Follows:** <#ID of an earlier task this builds on, or "none">
**Based on:** <task description · every attachment opened, by path, or "no screenshots">

> **Reviewer:** read the box. If every row looks right, reply **approve** — anyone can approve.
> **Small spec:** one small, low-risk change. If it's bigger, ask for `/kodion-create-spec <ID> --full`.

---

# Part A — Review this

```
┌─ AT A GLANCE ─────────────────────────────────────────────────────┐
│ Goal     <the one outcome, in the user's words>                   │
│ Changes  <what a user will see change, and where>                 │
│ Won't    <what people may expect but isn't included>              │
│ Keep     <what must not change, e.g. header, checkout>            │
│ Danger   <the worst thing that must never happen, or none>        │
│ Size     <n> reqs · <n> checks · <n> places · <risk> risk         │
│ Needs    <blocking questions + who answers, or nothing>           │
│ Verdict  <Ready to approve · check D1, D3 | Blocked by Q2>        │
└───────────────────────────────────────────────────────────────────┘
```

<Usually nothing here. Add one drawing only if it saves words — see references/visuals.md.>

## 1–3. Summary
**Why:** <1–2 plain sentences: what changes, and why.>
**Low risk because:** <e.g. "visual only: nothing saved, no login, no money, no personal data">

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | <plain requirement, with real values> | Must | <Task description / Your answer / Client / Project rules / Standard / AI> |

## 4.4 Where it appears
| Place (screen or part, in user words) | What the user should see | Check |
|---|---|---|
| <...> | <...> | AC-01 |

## 6. How we know it's done
| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given <...>, when <...>, then <...> (real values) | FR-01 |

## 9. Decisions I made — please check
<"None", or one row per AI choice>
| # | Decision | Why |
|---|---|---|

## 10. Questions for you
<"None", or one row per question>
| # | Question | Blocks | Who answers (Client / Dev) |
|---|---|---|---|

## 11. What exists today
- <what a user sees today, in one line>
- <bugs only: steps to reproduce, as a user would do them>

**Could break:** <plain list, or "nothing else">
**Attachments:** <one line per opened file: name — what it shows. Or "none".>

**To reply:** `approve` · or `D1 change: <what instead>` · or `Q1: <your answer>`

---

# Part C — For plan mode (no review needed)

## 12. Instructions for plan mode
Follow the **Small spec** section of `.claude/rules/plan-mode.md`.

| | |
|---|---|
| **Task** | `<ID>` · plan file: `.claude/plans/<ID>-<slug>.md` |
| **Type** | <Feature / Bug fix / Refactor / Chore — plan-mode.md says what each needs> |
| **Lessons that apply** | <e.g. "L3: one check per place", or "none"> |
| **Also for this task** | <anything this task needs that plan-mode.md doesn't cover, or "nothing"> |

## 13. Technical summary
*Filled by plan mode — the plan's path, the stack, and the acceptance-check table. Not a copy of the plan.*

## 14. Done report
*Filled after coding.*

## Quality check
**Blockers:** <none / list>
