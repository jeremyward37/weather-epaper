# Work log

## Session — T02 Repository bootstrap: GitHub monorepo outside iCloud

- **Task:** https://app.notion.com/p/jeremyward/T02-Repository-bootstrap-GitHub-monorepo-outside-iCloud-3e7d9adbacad81f2b514f98ae33439dc?source=copy_link
- **Started / finished:** 2026-09-25 23:35 MDT / in progress
- **Model:** GPT-6 · Medium (task recommendation: GPT-6 Luna · Medium)
- **Branch / PR:** `t02-repository-bootstrap` / local prep complete; no PR
- **Status at end:** In progress

### Result
Copied the project into `~/codeProjects/weather-epaper`, excluding generated dependencies/build output and `.claude`; initialized `main` and created baseline commit `0dff72a`. Created task branch `t02-repository-bootstrap` and updated the README repository link, canonical clone path, and frozen-folder note.

### Verification
`PATH=/bin:/usr/bin:/usr/local/bin:/opt/homebrew/bin ./build.sh` → `PASS` (5 normal + 2 state frames; 96 firmware bitmaps). `diff -qr design/exports <iCloud>/design/exports` → no differences. `git check-ignore design/.build design/node_modules design/.venv` → all three ignored.

### Decisions
- Kept the approved design and historical exports byte-identical; the build output matched the source exports.
- Used `main` for the approved-design baseline, then created the T02 task branch for the README and session changes.

### Problems
- `GITHUB_TOKEN` overrides GitHub CLI authentication and is invalid. `env -u GITHUB_TOKEN gh auth status` confirms the saved `jeremyward37` keyring credential is valid.
- The auto-review rejected `gh repo create ... --public ... --push` because publishing the full project to a public repository was considered broad external disclosure. Do not retry publication through another route; get Jeremy’s approval first.
- `sharp` is installed for arm64, while `/usr/local/bin/bash` runs x86_64 and causes universal Node to select the missing x64 binding. Putting `/bin` first selects system Bash and makes the required direct `./build.sh` invocation pass.

### Needs Jeremy
Approve publication of this repository to the public destination `https://github.com/jeremyward37/weather-epaper`; the exact payload is the locally reviewable baseline commit plus the README and T02 work-log changes on `t02-repository-bootstrap`. GitHub CLI is already authenticated when run with `env -u GITHUB_TOKEN`.

### Next
After Jeremy approves public publication: create and push the public repo from baseline `0dff72a` on `main`; enable PR-required protection on `main`; add `MOVED-TO-GITHUB.md` to the iCloud folder; push `t02-repository-bootstrap` and open a PR. Then verify remote state, clean Git status, and update the Notion card.

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
