# Orchestration state

This is the durable handoff ledger; update it with each run and approval. WORKLOG remains the append-only session history; Notion cards hold acceptance/status. Never store secrets.

- **Updated:** 2026-10-07 12:12 MDT
- **Active card:** T14 USB-powered board bring-up
- **Stage:** Awaiting Jeremy review and hardware evidence
- **Branch / checkout:** `codex/t14-bringup` / `/private/tmp/weather-epaper-t14`
- **Base / PR:** merged main `6887c8413abe53e705b5fc1ec6cacae30771229a`; [T14 PR #19](https://github.com/jeremyward37/weather-epaper/pull/19), reviewed implementation `4ac387dbbbb3672b11672222f360a83804c8d615`; subsequent review docs do not change firmware/config/workflow
- **Independent QA:** Pass for available software checks; separate `epaper_qa` GPT-6.1 Sol · High clean build/frame/driver/instructions review. Physical gates pending. See `t14-qa.md`.
- **Intended checks:** PlatformIO clean build, embedded setup header 15,000-byte/zero-pixel comparison, existing CI plus firmware build and artifact hashes.
- **Pending Jeremy action:** Review packet `t14-review.md`; approve flash of app SHA-256 `197954ed939d99b47ab43c8115749adb3fe8078ff43f5075bb58c5717018589d`, then photo/serial/button evidence. No flash/merge/advance authorized yet.
- **Next eligible task:** T15 only after T14's hardware/review/merge gates; T21 separately eligible, not dispatched.
- **Hardware:** Unboxed; supplied photos show USB-C, Reset/User/Boot and battery switch; Meshtastic screen. No battery; expected early November 2026. Jeremy intends continuous USB power until then. Weather firmware panel/serial acceptance is pending.
- **Reconciliation:** GitHub PR #17 merged at 2026-10-07 11:38:30 MDT (`6887c84`), required CI passed on final head `7e36c61`; Notion T23 Done. PR #18 (`bee7e19`) is open acceptance bookkeeping with passing CI, not a new T23 gate.

## Approval ledger

No implementation/release approvals recorded by this handoff. Jeremy's 2026-10-07 request authorizes preparing the orchestration setup, card updates, and this PR. It does not approve future frames, firmware, hardware checks, merges, deployment, purchases, or completion.

For each future approval append: task, date/time in America/Denver, human message/card evidence, PR/revision/artifact hash, approved action (review acceptance / merge / deploy / advance), and remaining restrictions. Preserve previous entries.

## Review packet template

```markdown
Task / PR / revision:
Stage and Notion status:
Implemented behavior:
Acceptance table (criterion | evidence | Pass/Fail/Pending):
Independent QA agent and verdict:
Commands run / CI link:
Artifact path and SHA-256:
Needs Jeremy (exact steps / expected results / evidence to return):
Open issues / rollback:
Approval requested (accept / merge / deploy / start next task):
```

## Historical T23 review packet (superseded by reconciliation above)

The saved branch pushed successfully on 2026-10-07 at approximately 11:34 MDT using the existing keyring credential. No credentials, remotes, or repository settings were changed. PR #17 is open and attached. The previous GitHub server error is resolved; its exact cause was not returned. The prior local Docker check could not run because the daemon was stopped; use required PR CI for the pinned rendering and regression checks. Named-role client discovery/loading remains unverified; scoped collaboration prompts remain available.

Resume this card first: inspect PR #17's latest head and required checks, resolve any failure, then obtain Jeremy's review/merge/advance authorization. Worktree: `/private/tmp/weather-epaper-orchestration`; branch: `codex/t23-orchestration` (if the temporary checkout is gone, recreate from the saved branch). Do not implement T14 or merge while CI or Jeremy's gate is pending.

## T14 preparation authorization — 2026-10-07

Jeremy's human messages in this chat request orchestration of the remaining project, provide unboxed-device photos and USB readiness, and specify continuous USB power until the battery arrives in early November. Preparing T14's software, independent QA and review packet is within that request. It does not authorize flashing, merging, deployment changes, hardware acceptance, or advancing beyond T14. Physical and release gates remain pending.

## T14 software gate evidence — 2026-10-07 12:12 MDT

Source `4ac387d`: local and independent clean build successful; embedded frame 15,000 bytes and zero differing pixels; independent QA software Pass. CI build and firmware passed on [run 37664544568](https://github.com/jeremyward37/weather-epaper/actions/runs/37664544568). Require both jobs green on the latest PR revision after review-record publication. Physical criteria and Jeremy acceptance/flash/merge/advance gates remain pending. Frozen local artifact and exact steps are in `t14-review.md`; card receives latest CI readback.
