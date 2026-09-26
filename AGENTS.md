# Instructions for coding agents

Read [README.md](README.md) first. It explains what this project is, its current status, which documents are authoritative, and how to build.

## Ground rules

1. **`docs/scope.md` is the source of truth for project scope; `design/spec.md` is the source of truth for the frame design.** `docs/design-brief.md` and `docs/context.md` are historical and partly superseded. Where they conflict with `scope.md`, `spec.md`, or `decisions.md`, the latter win.
2. **The canonical outputs are seven frames:** `design/exports/normal/normal-*.png` (5) and `design/exports/states/state-*.png` (2: setup, low-battery). `design/exports/archive/` is historical and is not the target.
3. **Never hand-edit generated files.** Everything under `design/.build/` (SVGs, raw PNGs, `fonts.conf`) is rewritten by `design/build.js`. Change `build.js` or `design/fixtures/*.json` instead, then rebuild.
4. **Run `./build.sh` before reporting a design change done.** `design/verify.py` must print `PASS`. Do not loosen a check to make it pass; if a design change was explicitly accepted, update `design/spec.md` and the check together.
5. **The panel is 1-bit.** Pure `#000000` and `#FFFFFF` only. Inspect the thresholded exports, not the smooth SVG or the raw render.
6. **Respect the approved decisions.** Four future 3-hour marks (12/3/6/9 AM/PM), three days starting tomorrow, no section headings, no location text, no separate precipitation-type glyphs, logo at footer right, civil dawn/dusk labeled `FIRST LIGHT` / `LAST LIGHT`, no severe-weather alert state, no stale badge (the footer timestamp is the staleness signal). Server-side rendering to static hosting, raw framebuffer on the wire, NWS data, battery power with a 5 AM–10 PM half-hourly schedule. Do not reintroduce the six-hour or five-day layouts, the alert strip, or the stale badge. See `design/decisions.md` "Scope decisions — 2026-09-25".
7. **The design is approved (checkpoint 3 closed 2026-09-25).** Do not change an approved frame without Jeremy's sign-off. Development planning starts from `docs/scope.md` §9.
8. **Record choices in `design/decisions.md`** and keep `spec.md`, `icon-map.md`, and `review-instructions.md` consistent with the exports.
9. **Plans recommend a model.** Jeremy builds this with OpenAI Codex; any plan you write must say which model and reasoning level to use for each task, as `docs/dev-plan.md` does. Re-verify the current Codex model list rather than copying an older table.
10. **Work from the Notion task card and log every session.** Development tasks live in Jeremy's Notion *Dev Tasks* database and are listed in `docs/dev-plan.md`. Before starting: read the card, set its Status to *In progress*, and open a `WORKLOG.md` entry using the template there. Before finishing: fill in the entry, copy the summary to the card's *Agent Notes*, and set Status to *Done* only if every acceptance criterion passed. `WORKLOG.md` explains the rules.
11. **Do one task per session.** Do not start the next card. If you discover work that belongs to another card, note it under *Next* in your log entry and on that card.
12. **The repository is the source of truth after T02.** The canonical clone is `~/codeProjects/weather-epaper`; the iCloud Drive folder is a frozen copy. Never run `git` inside iCloud Drive. Work on a branch and open a pull request; CI must be green before merge.
13. **Hardware steps are Jeremy's.** Flashing, plugging in the board, photographing the panel, buying parts, and DNS changes are done by Jeremy. Prepare everything, then stop and list the exact steps under *Needs Jeremy*. Cards marked *not agent-executable* are for Jeremy only.
14. **Frames must match byte for byte.** Use `tools/framediff.py` (after T03) to compare any produced frame with `design/exports/`. A nonzero diff is a defect unless Jeremy has approved a re-baseline in writing.
