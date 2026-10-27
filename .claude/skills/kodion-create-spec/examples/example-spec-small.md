# Footer text colour

`318` · Feature · **Small spec** · Low risk — visual only, one screen part, nothing saved
**Status:** Draft · 2026-10-21 · **Approved by:** — · **Skill:** kodion-create-spec v2.6.0
**Task:** `.claude/tasks/318/task.json` · **Branch:** `feature/318-footer-text-colour` (created by /start-task) · **Follows:** none
**Based on:** task description · `.claude/attachments/318.png`

> **Reviewer:** read the box. If every row looks right, reply **approve** — anyone can approve.
> **Small spec:** one small, low-risk change. If it's bigger, ask for `/kodion-create-spec 318 --full`.

---

# Part A — Review this

```
┌─ AT A GLANCE ─────────────────────────────────────────────────────┐
│ Goal     Footer text is Mid grey, matching the rest of the site   │
│ Changes  Footer text colour, every page, desktop and phone        │
│ Won't    Link hover colour, footer layout, link order             │
│ Keep     Where the links go, the logo, other page sections        │
│ Danger   none — visual only, nothing saved                        │
│ Size     2 requirements · 3 checks · 2 places · Low risk          │
│ Needs    nothing                                                  │
│ Verdict  Ready to approve · check D1                              │
└───────────────────────────────────────────────────────────────────┘
```

## 1–3. Summary
**Why:** the footer text is black, which looks heavy on the dark footer. It should be the design guide's "Mid grey", so it matches the rest of the site.
**Low risk because:** visual only — nothing saved, no login, no money, no personal data.

## 4.3 Requirements
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | All footer text (address, copyright line, link labels) is "Mid grey" instead of black. | Must | Task description |
| FR-02 | Footer links keep their hover colour. | Must | AI (D1) |

## 4.4 Where it appears
| Place (screen or part, in user words) | What the user should see | Check |
|---|---|---|
| Footer on every page, desktop | Mid grey text | AC-01 |
| Footer on a phone | Mid grey text | AC-02 |

## 6. How we know it's done
| ID | Given / When / Then | Covers |
|---|---|---|
| AC-01 | Given the home page and the Pricing page on desktop, when you look at the footer, then the address, copyright line and link labels are "Mid grey", not black. | FR-01 |
| AC-02 | Given a 375 px wide phone, when you open the home page, then the footer text is "Mid grey". | FR-01 |
| AC-03 | Given the footer, when you move the mouse over "Contact", then it changes to the same hover colour as today. | FR-02 |

## 9. Decisions I made — please check
| # | Decision | Why |
|---|---|---|
| D1 | Link hover colour stays as it is (FR-02) | The task only mentions the text colour. |

## 10. Questions for you
None.

## 11. What exists today
- Footer text is black on every page.

**Could break:** link hover colour (AC-03).
**Attachments:** `318.png` — the footer today, black text on the dark background.

**To reply:** `approve` · or `D1 change: <what instead>`

---

# Part C — For plan mode (no review needed)

## 12. Instructions for plan mode
Follow the **Small spec** section of `.claude/rules/plan-mode.md`.

| | |
|---|---|
| **Task** | `318` · plan file: `.claude/plans/318-footer-text-colour.md` |
| **Type** | Bug fix |
| **Lessons that apply** | L3: one check per place |
| **Also for this task** | nothing |

## 13. Technical summary
**Plan file:** `.claude/plans/318-footer-text-colour.md` · **Tech stack:** React + Tailwind · **Still small?** yes — 1 file

| AC | How it was proven |
|---|---|
| AC-01 | Chrome at 1280 px: footer text computed colour `rgb(100,116,139)` |
| AC-02 | Chrome at 375 px: same colour |
| AC-03 | Hover on "Contact" → unchanged from baseline screenshot |

## 14. Done report
**Result:** ✅ Done · **Date:** 2026-10-21 · **Branch:** `feature/318-footer-text-colour`

| AC | Result | Proof |
|---|---|---|
| AC-01 | ✅ | `footer.test.tsx` "footer text uses the muted token" |
| AC-02 | ✅ | Same test at the mobile breakpoint |
| AC-03 | ✅ | Hover state untouched; `git diff` shows one changed line |

**Checks:** lint ✅ · tests ✅ same as the known-failures list · build ✅
**Different from the plan · not done:** nothing

## Quality check
**Blockers:** none
