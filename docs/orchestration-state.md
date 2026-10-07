# Orchestration state

This is the durable handoff ledger; update it with each run and approval. WORKLOG remains the append-only session history; Notion cards hold acceptance/status. Never store secrets.

- **Updated:** 2026-10-07 13:17 MDT
- **Active card:** T15 Wi-Fi provisioning
- **Stage:** T14 accepted/merged/Done; authorized T15 implementation and independent QA starting
- **Branch / checkout:** `codex/t15-wifi-provisioning` / `/Users/jeremyward/.codex/worktrees/t15-wifi-provisioning/weather-epaper`
- **Base / PR:** merged T14 `08be1ac4024d1c79c25814f0881469804ab096a8`; T15 PR pending. T14 PR #19 merged after acceptance of head `6b39baa9c2851735d2e6b2f3497d816725c8adc2`.
- **Independent QA:** T15 pending; separate `epaper_qa` GPT-6.1 Sol · High. T14 final software and actual hardware evidence passed; see `t14-qa.md`.
- **Intended checks:** native button/provisioning tests, clean production and bounded persistence-harness builds, setup-header byte identity, credential-log audit, corrected upload parsing and final-head CI.
- **Pending Jeremy action:** None during T15 implementation. Its new firmware review/flash/phone/persistence/reset evidence, acceptance and merge remain pending. T14 acceptance/merge and T15 start are explicitly authorized below.
- **Next eligible task:** T16 only after T15's own hardware/review/merge gates and explicit advancement; T21 separately eligible, not dispatched.
- **Hardware:** T14 accepted: Jeremy flashed reviewed app, supplied setup photo, startup/no-pack ADC and button evidence. T15 physical provisioning/power-cycle/deep-sleep/reset tests pending. No battery; expected early November 2026; continuous USB intended. Battery calibration/life untested.
- **Reconciliation:** PR #19 merged at 2026-10-07 13:16 MDT (`08be1ac`), required CI passed on accepted head `6b39baa`; Notion T14 Done and T15 In progress. PR #18 remains earlier acceptance bookkeeping; it is not a new delivery gate.

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

## T14 acceptance, merge and T15 start — 2026-10-07 13:14–13:17 MDT

- **Human source:** Jeremy in this chat: “Accept T14, merge PR #19, and start T15.”
- **Accepted revision:** PR #19 head `6b39baa9c2851735d2e6b2f3497d816725c8adc2`, firmware implementation `4ac387dbbbb3672b11672222f360a83804c8d615`, frozen app SHA-256 `197954ed939d99b47ab43c8115749adb3fe8078ff43f5075bb58c5717018589d`.
- **Completed action:** both required jobs passed in run 37671983034; authorized squash merge completed 13:16 MDT as `08be1ac4024d1c79c25814f0881469804ab096a8`. Notion T14 set Done.
- **Authorized advancement:** start T15 Wi-Fi provisioning from the merged T14 code, with GPT-6.1 Sol · Medium implementation and separate GPT-6.1 Sol · High QA (availability checked in current runtime). Notion T15 set In progress, new managed worktree/branch and separate WORKLOG entry opened.
- **Remaining restrictions:** this does not authorize a new T15 flash, acceptance, merge, scheduled deployment change, or T16 advancement. Hardware remains Jeremy's under AGENTS.md rule 13.
