# Orchestration state

This is the durable handoff ledger; update it with each run and approval. WORKLOG remains the append-only session history; Notion cards hold acceptance/status. Never store secrets.

- **Updated:** 2026-10-07 13:05 MDT
- **Active card:** T14 USB-powered board bring-up
- **Stage:** All original T14 technical criteria and independent evidence QA Pass; awaiting Jeremy acceptance and merge authorization
- **Branch / checkout:** `codex/t14-bringup` / `/private/tmp/weather-epaper-t14`
- **Base / PR:** merged main `6887c8413abe53e705b5fc1ec6cacae30771229a`; [T14 PR #19](https://github.com/jeremyward37/weather-epaper/pull/19), reviewed implementation `4ac387dbbbb3672b11672222f360a83804c8d615`; subsequent review docs do not change firmware/config/workflow
- **Independent QA:** Pass for clean build/frame/driver, corrected upload parsing, actual photo/memory/no-pack ADC/buttons and startup-warning assessment; separate `epaper_qa` GPT-6.1 Sol · High. Final-head CI required before merge. See `t14-qa.md`.
- **Intended checks:** PlatformIO clean build, embedded setup header 15,000-byte/zero-pixel comparison, existing CI plus firmware build and artifact hashes.
- **Pending Jeremy action:** Review completed PR #19 evidence and explicitly accept T14/authorize merge. Authorize T15 advancement if desired. All required photo/serial/button evidence is now supplied; no repeat flash/test requested. Ctrl-C may stop monitoring with USB left connected. Acceptance, merge and T15 advancement remain unauthorized.
- **Next eligible task:** T15 only after T14's hardware/review/merge gates; T21 separately eligible, not dispatched.
- **Hardware:** Jeremy flashed the reviewed T14 app, supplied matching setup photo and actual startup/ADC/button output. No battery; expected early November 2026. Jeremy intends continuous USB power until then. Technical hardware checks Pass; explicit acceptance pending, battery calibration/life untested.
- **Reconciliation:** GitHub PR #17 merged at 2026-10-07 11:38:30 MDT (`6887c84`), required CI passed on final head `7e36c61`; Notion T23 Done. PR #18 (`bee7e19`) is open acceptance bookkeeping with passing CI, not a new T23 gate.

## Approval ledger

At the initial handoff, no implementation/release approvals were recorded. Jeremy's 2026-10-07 request authorized preparing the orchestration setup, card updates, and its PR. Subsequent approval entries below record the exact actions authorized; merge and advancement still require applicable explicit authorization.

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

## T14 flash approval — 2026-10-07 12:25 MDT

- **Human source:** Jeremy's message in this chat: “Approve T14 flash. I'm going to need instruction on setting up BOOT mode on this.”
- **Reviewed packet / revision:** PR #19 at `b677f3dcf23c89dc2fb699dd3eb4b28019dde7bd`; firmware implementation `4ac387dbbbb3672b11672222f360a83804c8d615` unchanged.
- **Approved artifact:** frozen local app SHA-256 `197954ed939d99b47ab43c8115749adb3fe8078ff43f5075bb58c5717018589d`; current build-path hash rechecked and matches.
- **Approved action:** Jeremy may connect in BOOT/download mode and flash this T14 artifact. No new permission question is required for that action. Agents still do not operate hardware or run upload commands under AGENTS.md rule 13.
- **CI:** Both build and firmware passed on final reviewed revision in run 37665386687; any new software change requires QA and new revision approval.
- **Remaining gates:** physical setup photo, actual no-pack ADC/button/startup readings, wire confirmation, Jeremy acceptance, authorized merge and separate T15 advancement. None passed by this approval alone.
