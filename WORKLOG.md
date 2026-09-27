# Work log

## Session — T03 feedback on proposed container frames

- **Task:** https://app.notion.com/p/jeremyward/T03-Pinned-renderer-container-and-frame-diff-tool-3e7d9adbacad81d8944bf5365c0dc2c5?source=copy_link
- **Started / finished:** 2026-09-26 20:35 MDT / 20:43 MDT
- **Model:** GPT-6 · Medium
- **Branch / PR:** `t03-rebaseline` / https://github.com/jeremyward37/weather-epaper/pull/3
- **Status at end:** In progress

### Result
Revised draft PR #3 after Jeremy's feedback. Replaced difference-bounded 3× review crops with full-frame 3× views so the unchanged footer logo is visible. Kept the setup screen's approved centered logo/no footer per Jeremy's clarification. Enabled Raleway lining numerals, moved the light-event label down 7 px, and right-anchored the time to leave a consistent 32 px visible right margin. Recorded the requested anchors in the draft spec and updated the re-baseline report and decisions.

### Verification
`./build.sh` on the host printed `PASS` after correcting right-anchor text centering. Six framediff unit tests passed. The pinned container regenerated seven 1-bit frames; `design/verify.py` still stops on the documented 5 px hourly gap in `normal-widths` versus the approved 7 px minimum. The review report lists the revised frame differences: 5,036–7,459 pixels across normal frames, 5,274 in low battery, and 5,738 in setup. No hourly-gap threshold was loosened.

### Decisions
- The footer logo was always present on normal and low-battery frames; review crops had hidden unchanged pixels. Jeremy confirmed that setup should remain as approved, with its centered logo and no footer.
- The numeral and sun-event adjustments are candidate design changes on the unmerged re-baseline branch. Full acceptance remains with Jeremy/T04.

### Problems
The pinned Linux raster still leaves only 5 px between two elements in the synthetic width fixture, below the approved 7 px requirement.

### Needs Jeremy
Review the revised full-frame images in PR #3 and approve or reject the container re-baseline, including the 5 px minimum gap. Do not merge before that decision.

### Next
T04 approval or further T03 revision; do not begin T05 or T06 in this session.

---

## Session — T03 Pinned renderer container and frame diff tool

- **Task:** https://app.notion.com/p/jeremyward/T03-Pinned-renderer-container-and-frame-diff-tool-3e7d9adbacad81d8944bf5365c0dc2c5?source=copy_link
- **Started / finished:** 2026-09-26 00:09 MDT / in progress
- **Model:** GPT-5 · Medium (task recommendation: GPT-6 Sol · Medium)
- **Branch / PR:** `t03-pinned-renderer` / pending
- **Status at end:** In progress

### Result
In progress.

### Verification
In progress.

### Decisions
- Branched T03 from the completed `t02-repository-bootstrap` branch because dependency PR #1 is still open and clean against `main`.

### Problems
- The local Docker CLI is installed, but the OrbStack Docker daemon was not running at session start.

### Needs Jeremy
None currently.

### Next
Complete T03 only; do not start T04, T05, or T06 in this session.

---

## Session — T02 Repository bootstrap: GitHub monorepo outside iCloud

- **Task:** https://app.notion.com/p/jeremyward/T02-Repository-bootstrap-GitHub-monorepo-outside-iCloud-3e7d9adbacad81f2b514f98ae33439dc?source=copy_link
- **Started / finished:** 2026-09-25 23:35 MDT / 2026-09-26 00:05 MDT
- **Model:** GPT-6 · Medium (task recommendation: GPT-6 Luna · Medium)
- **Branch / PR:** `t02-repository-bootstrap` / https://github.com/jeremyward37/weather-epaper/pull/1
- **Status at end:** Done

### Result
Created the public repository [jeremyward37/weather-epaper](https://github.com/jeremyward37/weather-epaper) with baseline commit `0dff72a` on `main`. Added PR-required protection to `main`. Pushed `t02-repository-bootstrap` with the README handoff note and this log, and opened PR #1. Added `MOVED-TO-GITHUB.md` to the iCloud source folder; no other iCloud files were changed.

### Verification
`PATH=/bin:/usr/bin:/usr/local/bin:/opt/homebrew/bin ./build.sh` → `PASS` (5 normal + 2 state frames; 96 firmware bitmaps). `diff -qr design/exports <iCloud>/design/exports` → no differences. `git check-ignore design/.build design/node_modules design/.venv` → all three ignored. `git status --short` → clean after final commit. GitHub API confirms repository is public with default branch `main`, PR-required protection is enabled, and PR #1 is open.

### Decisions
- Kept the approved design and historical exports byte-identical; the build output matched the source exports.
- Kept the approved-design baseline on `main`; delivered the README and session log from `t02-repository-bootstrap` through a pull request.
- Required pull requests on `main` with no status check configured yet; CI is introduced by T05.

### Problems
- The invalid `GITHUB_TOKEN` environment override prevented GitHub CLI and Git from using the valid saved keyring credential. Ran GitHub commands with `env -u GITHUB_TOKEN`.
- GitHub dropped chunked HTTP push requests. Pushing with `http.version=HTTP/1.1` and `http.postBuffer=524288000` succeeded.
- Automatic review initially blocked public publication as broad external disclosure; Jeremy explicitly approved the exact public destination on 2026-09-26.

### Needs Jeremy
None.

### Next
T03 — Pinned renderer container and frame diff tool. The repository is at `~/codeProjects/weather-epaper`; PR #1 is the T02 delivery.

---


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
