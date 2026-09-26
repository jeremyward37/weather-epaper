# Work log

One entry per agent session, newest at the top. Every task in `docs/dev-plan.md` requires an entry here **and** matching notes on its Notion card. Jeremy reads this file to understand what happened without replaying a session, so write for a reader who was not there.

## Rules for agents

1. **Start of session:** read `README.md`, `AGENTS.md`, `docs/dev-plan.md`, and the Notion task card. Set the card's Status to *In progress*. Add a `## Session` block below (copy the template) with the `started` line filled in.
2. **During the session:** keep the entry's *Decisions* and *Problems* lists current as you go, not at the end. Anything Jeremy must decide or do goes under *Needs Jeremy*.
3. **End of session:** fill in *Result*, *Verification*, and *Next*. Copy the same summary into the Notion card's *Agent Notes* section. Set Status to *Done* only when every acceptance criterion on the card passed and the verification commands you list actually ran. Otherwise leave *In progress* and say exactly what remains.
4. **Commit the entry** in the same commit or pull request as the work. The log is part of the deliverable, not a side note.
5. **Never rewrite or delete an earlier entry.** Add a new entry that corrects it.
6. **Never record secrets.** No Wi-Fi passwords, tokens, or API keys in this file or on a Notion card.
7. Use absolute dates (`2026-09-25`), not "today" or "yesterday".

## Entry template

```markdown
## Session — T<nn> <task title>

- **Task:** <Notion card URL>
- **Started / finished:** YYYY-MM-DD HH:MM MDT / YYYY-MM-DD HH:MM MDT
- **Model:** <Codex model · reasoning level actually used>
- **Branch / PR:** <branch name, PR URL if any>
- **Status at end:** Done | In progress | Blocked

### Result
What now exists that did not before. Files created or changed, commands that now work.

### Verification
Exact commands run and their outcome (`./build.sh` → `PASS`, test counts, pixel-diff result, photo filename).

### Decisions
Choices made during the task with a one-line reason each. Anything that changes `docs/scope.md`, `design/spec.md`, or `design/decisions.md` must also be recorded there.

### Problems
What went wrong, what was tried, how it was resolved or worked around.

### Needs Jeremy
Approvals, hardware steps, purchases, DNS changes, or questions. Empty if none.

### Next
The next task to run and anything it must know that is not already on its card.
```

---

## Session — T01 Design

- **Task:** https://app.notion.com/p/3e7d9adbacad80e8b299ef024d9cf444
- **Started / finished:** 2026-09-24 / 2026-09-25
- **Model:** Codex (design brief `docs/design-brief.md` §9 models)
- **Branch / PR:** none (pre-git)
- **Status at end:** Done

### Result
Approved design: five normal frames and two state frames in `design/exports/`, pixel-exact `design/spec.md`, `design/icon-map.md`, `design/review-instructions.md`, and the build/threshold/verify pipeline. Scope consolidated in `docs/scope.md`.

### Verification
`./build.sh` → `PASS` (5 normal + 2 state frames). Physical legibility checked by Jeremy 2026-09-25.

### Decisions
See `design/decisions.md`, including "Scope decisions — 2026-09-25" and "Development-planning decisions — 2026-09-25".

### Problems
iCloud conflict copies (`name 2.png`) in `design/assets/icons/`; the default build clears that folder.

### Needs Jeremy
None.

### Next
T02 Repository bootstrap (see `docs/dev-plan.md`).
