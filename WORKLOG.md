# Work log

## Session — T03 Pinned renderer container and frame diff tool

- **Task:** https://app.notion.com/p/jeremyward/T03-Pinned-renderer-container-and-frame-diff-tool-3e7d9adbacad81d8944bf5365c0dc2c5?source=copy_link
- **Started / finished:** 2026-09-26 00:09 MDT / 2026-09-26 00:25 MDT
- **Model:** GPT-5 · Medium (task recommendation: GPT-6 Sol · Medium)
- **Branch / PR:** `t03-pinned-renderer` / https://github.com/jeremyward37/weather-epaper/pull/2; proposed frames: `t03-rebaseline` / https://github.com/jeremyward37/weather-epaper/pull/3
- **Status at end:** In progress

### Result
Added the locked Node 22 renderer image, `tools/render.sh`, and `tools/framediff.py` with PNG/raw decoding, both polarities and bit orders, region accounting, diff output, and six synthetic tests. The pinned Linux renderer does not reproduce the approved macOS text raster: all seven frames differ, so `docs/rebaseline-report.md` and paired review artifacts document the proposed container baseline. Draft PR #2 holds the tooling; draft PR #3 isolates the proposed seven-frame re-baseline. T03 remains in progress pending Jeremy's T04 decision.

### Verification
`design/.venv/bin/python -m unittest discover -s tools -p 'test_*.py'` → 6 tests passed. Host `./build.sh` → `PASS` (5 normal + 2 state frames; 96 bitmaps). Container `./tools/render.sh` → six tests passed and a seven-row table; it exited 1 because the frame differences were 4,520–7,631 pixels and `design/verify.py` measured a 5 px worst-case hourly gap against the approved 7 px minimum. Pixel comparison of all 96 generated icon bitmaps → zero differing pixels.

### Decisions
- Branched T03 from the completed `t02-repository-bootstrap` branch because dependency PR #1 is still open and clean against `main`.
- Pinned `node:22.23.3-bookworm-slim` at digest `sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c`, `sharp` 0.33.5 from the npm lockfile, Python 3.11.2, and Pillow 12.3.0.
- Kept the approved exports unchanged on the tooling branch. Put only the proposed container frames and 3× previews on `t03-rebaseline` so T04 review cannot implicitly change the design contract.
- Did not loosen `design/verify.py` or change layout numbers. The 5 px gap needs explicit approval and a coordinated `design/spec.md` / verifier update if accepted.

### Problems
- OrbStack was not running at session start; started it and verified the Docker engine.
- The mounted macOS `node_modules` shadowed the container's Linux `sharp`; `tools/render.sh` now masks it with a container tmpfs and uses the locked image dependency.
- The host's `/usr/local/bin/bash` runs under Rosetta, making Node select the wrong `sharp` binary; `build.sh` now forces native arm64 Node on macOS, matching its existing Python safeguard.
- Linux Pango/FreeType text rasterization remained different after isolating fonts, loading fontconfig before `sharp`, and disabling hinting. The residual difference triggers the documented T04 re-baseline path.

### Needs Jeremy
Review draft PR #3 under T04 and approve or reject the container-rendered text. The measurable contract change is a worst-case hourly gap of 5 px instead of 7 px.

### Next
T04 — Jeremy reviews the diff masks and 3× approved/container crops in `docs/rebaseline-report.md`. If approved, update `design/spec.md` and `design/verify.py` together, merge the re-baseline, rerun `tools/render.sh` to zero diff, and then mark T03 Done. Do not start T05 or T06 first.

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
