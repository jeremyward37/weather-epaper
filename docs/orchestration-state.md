# Orchestration state

Durable current handoff; WORKLOG and historical entries below remain append-only evidence.

- **Updated:** 2026-10-07 21:23 MDT
- **Active card:** T24 daily forecast LO/HI display correction
- **Stage:** Software and independent QA Pass; awaiting exact-head CI then Jeremy review. Isolated from accepted main637c275. Notion In progress; no merge/deployment approval.
- **Branch / checkout:** codex/t24-daily-low-high / /Users/jeremyward/.codex/worktrees/t24-daily-low-high/weather-epaper
- **Base:** accepted main637c2751c740f1a6dfe939a45acece1f09e5b74f
- **Models:** GPT-6.1 Sol Medium implementation / High independent QA; verified in current runtime.
- **Scope:** three daily pairs H°/L° → L°/H°; NWS high/low meanings unchanged. Approved source/spec/checks/generated re-baseline only in the daily temperature text regions, setup byte-identical.
- **Dependency:** completed T11 renderer; stage7. Jeremy explicitly moved T24 ahead of pending T16 hardware via “let's do T24 now if we can”. T18 remains stage10 with T24 required.
- **Verification:** pinned ./build.sh PASS, seven canonical comparisons, six CLI fixture rows, signed/equal/wide pair fit, authorized pixel-region differences, independent QA and green review-head CI.
- **Deferred T16:** In progress in https://github.com/jeremyward37/weather-epaper/pull/21 at93acc72. Corrected production3fc1e59/app4d9e35cf remains installed. Two actual17:30/18:00 TIMER cycles and initial photo/BOOT no-redraw Pass; full-hour/offline/remaining button criteria and acceptance/merge pending. Prior observer is stopped/unknown cause; no current capture. Evening photo shows later8:42PM frame. Preserve its existing managed checkout and release artifacts.
- **Review evidence:** docs/t24-review.md (seven before/after links), docs/t24-rebaseline.md (masks/hashes), docs/t24-qa.md (independent Pass). Final PR/head/CI recorded on GitHub and Notion.
- **Release gate:** present concrete T24 before/after review after final-head CI; no merge or new deployment/flash authorized. The existing T12 publisher continues accepted configuration.

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

## T15 software review gate — 2026-10-07 13:47 MDT

Final source `b8ae0c4`: independent software QA Pass and both source CI jobs Pass (run 37676538752). Frozen read-only bundles: `/private/tmp/weather-epaper-t15-artifacts/b8ae0c4c1680d6fd3857b6d413248e298599d8ee/`, normal app SHA-256 `736c18b0ae031f60d32c1980192d0bc36a9de83fa0afa4f646ba0494a3556b3a`, bounded persistence-harness app `302af824bfe29974268d555605b6acb756945d4f16f13f93471d203d05a4fbd2`. Whole bundles/checksums and exact commands are in `t15-review.md`; earlier T15 build hashes are superseded. Final review-record CI remains required before release/merge and is recorded on GitHub/Notion. Jeremy has not yet approved these new flashes, performed physical T15 checks, accepted T15, or authorized its merge/T16 advancement. Card remains In progress; stop at this gate.

## T15 normal flash and persistence-test approval — recorded 2026-10-07 14:01 MDT

- **Human source:** Jeremy in this chat: “approve T15 flash and persistence test”.
- **Reviewed revision:** PR #20 head `250ec59bdb3a7351a5012867098c4b1ded9b1ee2`; audited firmware/config/test/workflow source `b8ae0c4c1680d6fd3857b6d413248e298599d8ee`, unchanged.
- **Approved artifacts:** normal app SHA-256 `736c18b0ae031f60d32c1980192d0bc36a9de83fa0afa4f646ba0494a3556b3a`; bounded persistence harness `302af824bfe29974268d555605b6acb756945d4f16f13f93471d203d05a4fbd2`. Both frozen bundles' source and all five file hashes rechecked and match.
- **CI readback:** both required jobs SUCCESS on the exact reviewed head in run 37677877843. Approval bookkeeping does not rebuild or alter the artifacts.
- **Approved action:** Jeremy may flash the normal bundle, run provisioning/reset/power-cycle tests, flash the separate bounded persistence harness, observe timer-sleep reconnect and restore normal firmware. Agents prepare/record/guide; no agent upload, reset or port operation under rule 13.
- **Remaining gates:** actual physical/serial/photo evidence, Jeremy's T15 acceptance and authorized merge, then separate T16 advancement. The flash approval alone does not pass these gates. No new permission question for the two approved artifacts.

## T15 Terminal-command override and normal flash — recorded 2026-10-07 14:12 MDT

Jeremy asked “Can't you run terminal commands? Why do I need to?” after approving T15 flash and persistence. This overrides rule 13's manual Terminal handoff for the approved uploads and serial monitoring, including harness and normal restore. Physical phone/button/power/photo operations remain Jeremy's. No repeat artifact approval required.

The agent verified the normal frozen source/all file hashes and ran explicit-offset esptool with automatic `--before default-reset`; exit 0, all four written-image hashes verified. Normal app/source/hash remain those approved above. Startup reached setup frame and AP IP 192.168.4.1. Evidence: firmware/logs/t15-normal-flash-record.md and t15-first-startup.txt. Serial monitor opening itself produced a USB reset; do not count it as spontaneous reboot. Phone/save, power cycle, BOOT reset and timer-sleep criteria remain pending. T15 In progress; no acceptance, merge or T16 advancement.

## Explicit user pause — 2026-10-07 14:40 MDT

Jeremy: “You'll have to wait. I had to take my computer elsewhere. I'll let you know when to restart.” Honor this pause until an explicit restart. Bounded observer ended before the reported power cycle; unchanged panel reported, new serial reconnect not captured. Subsequent port open failed before device access because the port was absent. No harness upload performed. Approved artifact hashes remain unchanged and approvals persist. No ongoing serial capture. Local pause records await publication with resumed evidence.

## Explicit restart — 2026-10-07 15:31 MDT

Jeremy said restart. Earlier pause revoked; approved Terminal upload/monitor/harness/normal restore scope persists. Same board is at /dev/cu.usbmodem114101. Resume T15 only; no new acceptance, merge or T16 authorization.

## T15 resumed sleep-test evidence — 2026-10-07

Actual harness upload verified all four writes. Runtime logged saved reconnect, sleep entry, USB disappearance, raw reattachment, saved reconnect and Timer wake reconnected; persistence observed. Independent epaper_qa audit: one real timer-wake persistence cycle Pass; success cannot follow a USB reset or portal re-provision in unchanged source. Ten seconds configured, not independently timed. Raw observer omits DTR/RTS ioctl and disables HUPCL but host tty behavior prevents a universal reset-free claim. Exact approved normal restored successfully, saved reconnect observed; harness removed. Evidence in firmware/logs/t15-timer-persistence* and t15-normal-restore-record.md. BOOT/second physical-cycle/failure/USER/photo checks and acceptance/merge still pending.

## T24 start-now authorization — 2026-10-07 21:10 MDT

Jeremy: “let's do T24 now if we can”. This supersedes after-T16 sequencing for this independent renderer correction. T24 implementation starts from accepted main, with its own branch/log/QA/review. T16 stays pending and untouched. T24 dependency corrected to completed T11, stage7; T18 still stage10. No acceptance, merge or new deployment authorized.
