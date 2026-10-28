# <Task name>

`<ID>` · <Feature | Bug fix | Refactor | Chore> · <Small | Medium | Large> size · **<Low | Medium | High> risk** — <one-line reason>
**Status:** Draft · <today> · **Approved by:** — · **Skill:** kodion-create-spec v<version>
**Task:** `.claude/tasks/<ID>/task.json` (or "manual, no timesheet task") · **Branch:** `<branch>` (<created by /start-task | not created yet | none (no git set up)>) · **Depends on:** <other tasks or client inputs needed first, or "none"> · **Follows:** <#ID of an earlier task this builds on, or "none">
**Based on:** <task description · live site or screen · every attachment opened, by path (`.claude/attachments/<ID>.<ext>`), or "no screenshots">

> **Reviewer:** read the box. If every row looks right, reply **approve** — anyone can approve, at
> any risk. If a row looks wrong, the tables below and Part B have the detail. Part C is for plan mode.

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

<One drawing here, or nothing. A fenced mermaid block — graph LR (flow), graph TD
(before to after) or sequenceDiagram (journey) — plus a plain-text copy under it when
.claude/spec-visuals says mermaid+text. An output preview or places list stays plain text.
See references/visuals.md. Never more than one drawing.>

## 1–3. Summary
**Why:** <1–3 plain sentences: the problem today, who it affects, what we want instead.>
**Quality:** <score> / 100 · <no blockers / list>

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | <plain requirement> | <Must / Should / Could> | <Task description / Your answer / Client / Project rules / Standard / AI> |

<sub>Must = can't ship without it · Should = soon after · Could = nice to have · Source "AI" = my suggestion, please check it</sub>

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | <...> | <...> |

## 10. Questions for you
| # | Question | Blocks | Who answers (Client / Dev) |
|---|---|---|---|
| Q1 | <...> | <Planning / Coding / Going live / Nothing> | <Client / Dev> |

**To reply:** `approve` · or `D1 change: <what instead>` · or `Q1: <your answer>`
**Not sure?** Open Part B for the detail behind any row above.

---

# Part B — Details (open if needed)

<details>
<summary><b>4.1 Who uses it · 4.2 Key information</b></summary>

### 4.1 Who uses it
| Who | What they can do |
|---|---|
| <user type> | <...> |

### 4.2 Key information
| Item | What it holds |
|---|---|
| <thing> | <plain description> |

</details>

<details>
<summary><b>4.4 Where it appears and its life (<n> places · <n> stages · tester checklist)</b></summary>

### 4.4 Where it appears and its life
*If Part A already shows the places list drawing, delete this first table and keep only the stages and the checklist below — never print the places twice.*

**Where it appears** (every place a user can see it)
| Place | What the user should see | Check |
|---|---|---|
| <screen or part, in user words> | <...> | AC-.. |

**Life of the item** (Medium / Large)
| Stage | What should happen | Check |
|---|---|---|
| <create / edit / each status / complete / history / delete / refresh / reports> | <...> | AC-.. |

**What testers usually find missing** (Medium / Large)
| # | Question | Answer |
|---|---|---|
| C1 | Still there after a page refresh or on another device? | |
| C2 | A new status or type has its own colour, badge, filter option and legend entry? | |
| C3 | No word or label shown twice? | |
| C4 | Timers, tracking, counters, notifications and emails start and stop when they should? | |
| C5 | Validation, empty state and error message covered? | See §5 |
| C6 | Same rules on every screen (who can see or edit it)? | |

</details>

<details>
<summary><b>5. When things go wrong (<n> situations)</b></summary>

## 5. When things go wrong
| Situation | What the user sees |
|---|---|
| <wrong or missing input> | <...> |
| <nothing to show> | <...> |
| <no permission> | <...> |
| <something fails> | <...> |

</details>

<details>
<summary><b>6. How we know it's done (<n> acceptance checks)</b></summary>

## 6. How we know it's done
| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given <...>, when <...>, then <...> | FR-01 |

</details>

<details>
<summary><b>7. Safety & security (<n> apply · <n> not involved)</b></summary>

## 7. Safety & security
Only the areas that apply get a row. Every other area is named in the "Not involved" line, with a short reason.

| Area | What we do |
|---|---|
| <area that applies> | <...> |

**Not involved (checked):** <area> (<reason>) · <area> (<reason>) · …

</details>

<details>
<summary><b>8. Rules & limits</b></summary>

## 8. Rules & limits
- Follows the project's existing rules and design guide.
- <task-specific limits>

</details>

<details>
<summary><b>11. What exists today</b></summary>

## 11. What exists today (as a user sees it)
- <today's behaviour>
- <for bugs: steps to reproduce, as a user would do them>

**Things that could break:** <plain list>

**Attachments:** <one line per opened file: name — what it shows. Or "none".>

</details>

---

# Part C — For plan mode (no review needed)

## 12. Instructions for plan mode
Follow the **Full spec** section of `.claude/rules/plan-mode.md`.

| | |
|---|---|
| **Task** | `<ID>` · plan file: `.claude/plans/<ID>-<slug>.md` |
| **Type** | <Feature / Bug fix / Refactor / Chore — plan-mode.md says what each needs> |
| **Lessons that apply** | <e.g. "L3: one check per place", or "none"> |
| **Required for Risk <level>** | <copy the checks for this level from references/risk-matrix.md, section 3> |
| **Also for this task** | <anything this task needs that plan-mode.md doesn't cover, or "nothing"> |

## 13. Technical summary
*Filled by plan mode — the plan's path, the stack, and the acceptance-check table. Not a copy of the plan.*

## 14. Done report
*Filled after coding.*

## Quality check
**Blockers:** <none / list> · **Score:** <n> / 100
