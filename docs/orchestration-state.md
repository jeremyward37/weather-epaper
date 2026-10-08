# Orchestration state

This is the durable handoff ledger; update it with each run and approval. WORKLOG remains the append-only session history; Notion cards hold acceptance/status. Never store secrets.

- **Updated:** 2026-10-07 21:07 MDT
- **Active card:** T16 wake, sync time, fetch frame, display and deep sleep
- **Stage:** Corrected production approved and uploaded after green CI. Actual startup/SHA save, brief BOOT no-redraw and first corrected TIMER cycle Pass in independent partial QA. Previous observer is no longer running; partial log contains17:30 and18:00 TIMER cycles, with no18:30 record; full-hour/offline/remaining button and acceptance/merge gates pending; photographed visual fidelity Pass.
- **Branch / checkout:** `codex/t16-wake-fetch-sleep` / `/Users/jeremyward/.codex/worktrees/t15-wifi-provisioning/weather-epaper` (attached managed checkout reused on new branch)
- **Base / PR:** merged T15 `637c2751c740f1a6dfe939a45acece1f09e5b74f`; [PR #21](https://github.com/jeremyward37/weather-epaper/pull/21).
- **Software/artifact revision:** `3fc1e59235b4fc3b456c2b6d75aa380965899cc1` (corrected BUSY phase; approved production4d9e35cf now installed). Review/QA documentation-only commits do not change firmware/config/tests/workflow or frozen bundles.
- **Independent QA:** epaper_qa GPT-6.1 Sol · High correction Pass: 25 baseline native invocations, six independent active/sleep BUSY cases, old-code sensitivity fails as expected, independent clean production build, all frozen hashes/offsets/CLI checks and 471 pinned library identities. Reports `docs/t16-busy-fix-qa.md` and actual partial hardware `docs/t16-corrected-upload-qa.md`; original068 audit is historical. Photographed visual fidelity Pass in docs/t16-photo-qa.md; full-hour/offline/remaining button criteria Pending.
- **CI:** Corrected upload reviewed head847c8b1a494e3a6cc8cf0300f7977625d3a6db70 had both required jobs SUCCESS in run37701828781. Evidence-only head586f58a has both jobs SUCCESS in run37703737928; new evidence-only commits need latest-head green CI before acceptance/merge; they do not replace the approved frozen bundle.
- **Frozen root / installed production:** `/private/tmp/weather-epaper-t16-artifacts/3fc1e59235b4fc3b456c2b6d75aa380965899cc1/`; normal app1320576 bytes, SHA4d9e35cfeaf3b712abc5eb2737b95fcd4c5e3d45bd077f2c8c031df977e8a648. Debug/harness are separately hashed regression artifacts, not proposed production releases. See `docs/t16-review.md`.
- **Pending Jeremy action:** Device remained connected while Jeremy was away; Mac sleep is unknown. Evening photo IMG_2846.JPG shows a later8:42PM weather frame, without proving its wake cause. No action/reflash needed tonight. Collect a complete daytime production observation window covering three consecutive slots, with the Mac awake, then deferred offline/recovery and remaining buttons. Session54253 is unavailable and no observer is running. Agent handles Terminal; production release unchanged.
- **Physical criteria:** actual production wakes across at least one hour, matching preview/changed/unchanged/offline retention, deep-sleep current or documented reason unavailable; not established by compilation/native fakes.
- **Next eligible task:** No T17 advancement before T16 original criteria/review/authorized merge and explicit start.
- **Hardware:** Approved corrected production3fc/app4d9e35 installed, four write hashes verified and saved Wi-Fi/NTP/verified HTTPS successful. Jeremy confirms weather visible; actual changed refresh/SHA save and sleep succeeded. Brief BOOT actual identical-no-redraw plus human no-flicker Pass; first corrected17:30 TIMER accepted frame/no redraw/sleep to18:00. Photographed visual fidelity Pass; full-hour, offline/recovery and remaining buttons Pending. Continuous USB/no battery; ADC0 selects provisional lowbat without charge/pack presence inference. Original068 and17:00 defect traces are historical.
- **Reconciliation:** PR20 merged16:07:53 MDT as637c275 after both accepted-head CI jobs SUCCESS. T15/T12 Done, T16 In progress. Host endpoint trusted/exact-size/hash/zero-diff checks pass; observed stale footer/T21 reliability issue remains separate. No hosting changes or later-card work.

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

## T15 acceptance / PR20 merge / T16 start — 2026-10-07 16:07 MDT

Jeremy: “So long as I should not be seeing the weather yet on it then yes I accept T15, merge PR #20 and start T16 please.” Setup retention at T15 is expected. Accepted head6e0c57f36abd041468066961de6ed02d627867b6, both required checks green in run37693025721. Exact-head-guarded squash merge637c2751c740f1a6dfe939a45acece1f09e5b74f at16:07:53 MDT; T15 Done. T16 start explicitly authorized, separate branch and log opened, card In progress. No T16 flash/release/merge or T17 advancement authorized by this message. Prior Terminal-operation override persists; no manual Terminal handoff is required for later approved device operations.

## T16 software review packet — 2026-10-07 16:41 MDT

Source0681135: independent software QA Pass, both source CI jobs SUCCESS in run37696744465; concrete PR21/review packet and frozen normal17122de5 app prepared. Exact latest-head CI readback is required and recorded on GitHub/Notion before presenting approval. No hardware upload/access or new hosting change occurred. Production-only flash and one-hour test is requested, with agent Terminal operations under the existing override. Original physical criteria/current measurement or documented limitation, Jeremy acceptance, authorized merge and T17 advancement remain Pending; T16 In progress. No debug/harness flash approval inferred.

## T16 production flash / one-hour-test approval — 2026-10-07 16:51 MDT

Jeremy: “Approve t16”, replying to the exact production-flash/one-hour-test request. Reviewed PR21 head da21f3b8a55e1e41e995636b7bf401a7e4ff793e, both required CI jobs SUCCESS in run37697987046, re-read before release. Audited source068113577d1739da8b7ac13cfc77dec5d3b7d7c6 and frozen normal app SHA17122de56f655b7b37bcc3464f310416ec8b48e189730157e95b9b9a0bc29957 unchanged. Approval permits agent production upload/serial capture under the enduring Terminal override and Jeremy physical test steps. No NVS erase, debug/harness flash, T16 acceptance/merge or T17 start. Original physical criteria/current-or-reason and independent hardware reconciliation remain pending; card In progress. Session opened before upload.

## T16 corrected software gate — 2026-10-07 17:04 MDT

Initial approved068/app17122 upload and visible weather succeeded, but post-hibernate BUSY HIGH falsely prevented SHA commit. Same defect repeated at the real17:00 TIMER slot. Primary SSD1683 documentation confirms sleep HIGH; native fake previously forced LOW and masked it. Minimal source3fc1e59235b4fc3b456c2b6d75aa380965899cc1 fixes active readiness before hibernate; real timeout protection unchanged. New frozen production1320576 bytes SHA4d9e35cfeaf3b712abc5eb2737b95fcd4c5e3d45bd077f2c8c031df977e8a648, independent correction QA Pass and three clean local builds. Final documentation-head required CI readback will be recorded on GitHub/Notion before the approval request. This new bundle is not authorized by original approval. No corrected upload/merge/T17. Actual initial trace retained; observer stopped17:01. Jeremy's no-suitable-meter reason recorded; no measured current or one-hour/no-redraw/offline pass.

## Deferred LO/HI correction captured — 2026-10-07 17:15 MDT

Jeremy requested the three daily temperatures read LO/HI and authorized a separate later task. [T24](https://app.notion.com/p/3f2d9adbacad81af943af1a0f1cb24fb) created Not started, task order 24 / dependency stage 9, after T16 acceptance/merge and before T18 final sign-off. T18 now includes T24; stage 10 and downstream stages remain unchanged. Model availability checked in the current runtime: GPT-6.1 Sol · Medium implementation / High independent QA. No due date assigned. Only daily displayed pair order is approved; data semantics remain unchanged. No design/render/export/firmware/deployment change occurred. T16 still waits for corrected production4d9e35cf flash/one-hour approval; no corrected upload, acceptance, merge or next-card dispatch is inferred. Documentation-only tracking does not alter frozen source3fc1e59 or its release bundle.

## Corrected T16 production approval — 2026-10-07 17:18 MDT

Jeremy said “approve corrected T16 flash,” referring to the pending corrected production packet. Frozen source3fc1e59235b4fc3b456c2b6d75aa380965899cc1 / app SHA4d9e35cfeaf3b712abc5eb2737b95fcd4c5e3d45bd077f2c8c031df977e8a648. Agent Terminal override persists. Only production upload and its authorized observation/test scope; no debug/harness, NVS erase, acceptance, merge or next-card start. Full original physical criteria remain pending. PR21 documentation headfad90fb0c4767696eca8f87ce2921674e7ea9705 must have both checks green before upload. Port absent during sleep; physical BOOT/RESET entry requested.

## Corrected T16 flash prepared; waiting for physical BOOT entry — 2026-10-07 17:21 MDT

Required build and firmware SUCCESS on approved documentation headfad90fb0c4767696eca8f87ce2921674e7ea9705 in run37701282248. Frozen source/all five hashes rechecked; app1320576 bytes / SHA4d9e35cf… unchanged. Repeated same-board discovery found no Espressif port while the device sleeps. Physical BOOT/RESET sequence requested; no reply yet. Prepared `/private/tmp/weather-epaper-t16-corrected-flash-and-observe.py` with the frozen production identities, four offsets/no erase, manual ROM no-reset and separate corrected logs plus bounded90-minute observer; none executed. Approval persists, no repeat artifact permission needed. After physical reply, recheck latest-head CI and enumerate the same serial2884859F0EFC, then upload. No active capture or automation. T16 In progress; no acceptance/merge/advancement.

## Corrected T16 flashed; partial actual hardware success — 2026-10-07 17:30 MDT

Jeremy completed physical ROM entry and normal RESET, confirms weather visible; brief BOOT observation stayed unchanged without flashing. Reviewed head847c8b1 had both required checks SUCCESS in run37701828781. Approved frozen source3fc1e59/app4d9e35cf/all five hashes verified; exact four production writes exit0/all hashes verified, no NVS erase. Actual cold startup saved Wi-Fi/NTP/verified15000lowbat/display4694ms `changed-refreshed-hibernated-sha-saved`; BOOT immediate accepted frame and `identical-no-redraw`; first corrected17:30 TIMER (20-second lead) accepted frame at23:30:01UTC, no redraw, sleep to18:00. Independent partial hardware QA Pass; one-hour/fidelity/offline/USER/longclear and final reconciliation/acceptance remain Pending. Jeremy defers Wi-Fi-loss test because it would disrupt others; not waived. See docs/t16-corrected-hardware.md and its evidence/QA. Live bounded90-minute raw observer session54253 remains active, ends approximately18:56:49MDT; leave USB through18:35 for18:00/18:30 slots. No debug/harness, hosting change, merge or next-card start.

## T16 photo fidelity — 2026-10-07 17:41 MDT

Jeremy supplied IMG_2844.JPG (SHAe3cfabfc8e0e4effc0586613a0b07ada4098442657f18758e8df68b6685cd7f0). Root and independent visual QA Pass against saved5:05PM lowbat reference: all values/icons/footer, full-frame orientation/polarity/placement, no visible crop/shift. Photo perspective/focus does not support pixel-equality claims. Full-hour/offline/remaining buttons and final reconciliation/acceptance remain pending; observer54253 active/bounded until18:56:49. Original photo remains local; docs/t16-photo-qa.md and corrected hardware record preserve identity and limits. T24 LO/HI remains queued. No source/artifact/hosting change, acceptance, merge or next-card start.
