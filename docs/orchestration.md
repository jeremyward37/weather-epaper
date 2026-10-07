# Orchestrator handoff

Updated 2026-10-07. Jeremy requested implementation subagents, independent testing/QA, and pauses for his review. This procedure governs remaining execution; scope and frame authority remain `docs/scope.md` and `design/spec.md`.

## Current handoff

Reconciled 2026-10-07: T01–T15, T22 and T23 are Done; T15 PR #20 merged as `637c275` after green accepted-head CI. Jeremy accepted T15 and explicitly authorized T16 start. T16 is In progress in PR #21. Initial approved production flash displayed weather but exposed a false BUSY-after-hibernate error; corrected source3fc1e59/new frozen production4d9e35cf passed independent software QA/green CI and Jeremy approved its upload. Actual startup/display/SHA save, brief BOOT no-redraw and first corrected TIMER cycle have partial independent hardware Pass; bounded observation continues. Photographed frame fidelity Pass; original one-hour/offline/remaining button and acceptance checks remain Pending; the permitted no-suitable-meter measurement limitation is recorded. T17–T21 remain Not started. Original T14/T15 hardware criteria and independent QA passed. Jeremy plans continuous USB until the battery arrives in early November. Resume T16 from orchestration-state.md; its own software, flash/hardware, acceptance and merge gates remain required.

## Start or resume

Use GPT-6.1 Sol · High for the primary orchestrator. In Codex, open the canonical project, update from merged `origin/main` in a clean branch/worktree, and send:

```text
Act as the weather-epaper orchestrator. Read README.md, AGENTS.md,
docs/dev-plan.md, docs/orchestration.md, docs/orchestration-state.md,
and WORKLOG.md. Reconcile current Notion cards and GitHub PRs before acting.
Use implementation and independent QA subagents for one eligible card.
For the initial run select T14 after T23 has been approved and merged.
Build the concrete deliverable, run acceptance checks, obtain independent QA,
and open a PR with green required CI. Then stop with a review packet and exact
Needs Jeremy steps. Never merge, deploy, flash, mark hardware checks passed,
or advance to another card without the applicable recorded Jeremy approval.
On resume, handle the pending gate first; preserve all evidence and approvals.
```

This is a manually started/resumed Codex workflow. Saved instructions do not start a background process. The project provides named-role definitions in `.codex/agents/`. Their TOML syntax/schema has been checked, but discovery/loading in the next Codex client is unverified. Until role loading is confirmed, supply the same role instructions through general collaboration spawn prompts. No API service or scheduled automation is required. If subagents are unavailable, report that independent QA is pending; do not relabel self-review as independent QA.

## Roles and ownership

| Role | Model · effort | Responsibility |
|---|---|---|
| Primary orchestrator | GPT-6.1 Sol · High | Select the eligible card, own Git/Notion/log/state, assign files, integrate results, collect evidence, pause for Jeremy. |
| `epaper_implementer` | GPT-6.1 Sol · task row effort | Implement only assigned card/files and return changes, checks, uncertainties, and hardware instructions. |
| `epaper_qa` | GPT-6.1 Sol · High | Independently review the finished revision against every criterion; execute available checks; identify failures and missing physical evidence. Do not modify production code. |
| `epaper_docs` | GPT-6 Luna · High | Assigned documentation/measurement analysis only; orchestrator integrates it. Never update task status or approve releases. |

These choices were checked against the [current models](https://learn.chatgpt.com/docs/models) and [subagent configuration](https://learn.chatgpt.com/docs/agent-configuration/subagents) on 2026-10-07. GPT-6 Sol · High is the explicit fallback when 6.1 Sol is unavailable. Re-check availability in the next client. At most three children run concurrently, subject to runtime limits. Subagents inherit runtime permissions; role instructions constrain behavior and are not a security boundary.

Pass the selected card's reasoning effort explicitly when spawning `epaper_implementer` (High for T14/T16, Medium for T15/T17); its TOML leaves effort unset so this choice can apply. QA always uses High.

Only the orchestrator mutates Notion, commits, pushes, opens PRs, and writes WORKLOG/state. One implementation writer at a time per checkout. QA runs after writes finish; independent read-only investigation may run alongside implementation. Any test writer gets exclusive test-file ownership and separate scratch outputs. Delegation is within one card; it is not permission to run several cards concurrently.

## Execution and pause contract

1. **Reconcile.** Read the card and all dependency statuses; inspect Git state and existing PRs. Resume pending work rather than duplicating it. Do not dispatch Jeremy-only cards. Optional T21 requires its explicit scope decision before external service setup.
2. **Open the run.** Set the selected card In progress; append a WORKLOG entry. Record card, branch, stage, and intended verification in `orchestration-state.md`. Allocate a `codex/tNN-slug` branch. Keep each task and resumed run separately logged.
3. **Implement.** Assign bounded work to implementation. Prepare firmware builds, meaningful native tests, deterministic frame comparisons, and exact reproducible flash/test instructions. Hardware work stays with Jeremy.
4. **Independent QA.** Give a different child the card, full acceptance criteria, diff/base and revision, test commands, and evidence. Require a criterion-by-criterion Pass/Fail/Pending table. QA re-runs meaningful checks and assesses failure paths, TLS verification, schedule/DST, credential handling, framebuffer length/polarity, battery hysteresis, and power behavior as relevant. Physical observations cannot be inferred from compilation.
5. **Fix and re-check.** Resolve actionable QA findings; re-review changed areas and run affected checks. Required CI must pass on the revision under review. Do not change approved exports or weaken checks.
6. **Pause with a review packet.** Include card and PR links, revision, behavior delivered, checks and QA results, unresolved criteria, build artifact/hash, exact Needs Jeremy commands and expected results, rollback instructions where relevant, and the decision requested. Stop spawning implementation work while waiting. Record `Awaiting Jeremy review` or `Awaiting hardware evidence`; Notion remains In progress.
7. **Resume the gate.** Accept only an explicit human approval identifying the task/PR/revision or unambiguously referring to the pending packet. Record date, source, approved revision, and scope. An agent verdict, elapsed time, a photo without interpretation, or delivery notification is not approval. Changes after approval require QA and approval of the new revision. Merge only with explicit merge authorization and green required CI. New deployment changes and hardware releases require explicit authorization for that action too. The already authorized T12 scheduled publisher continues under its existing configuration; this handoff does not suspend it.
8. **Complete or pause.** For agent delivery cards, Done requires every original and added criterion, independent QA, applicable hardware evidence, Jeremy acceptance, and authorized merge. Jeremy-only T19 completes from its actual recorded measurement evidence and Jeremy acceptance; it does not require an implementation PR unless an authorized documentation change is delivered. Log the result and copy it to Agent Notes. Approval to merge the current card does not authorize starting the next one; request/record permission to advance. A continuing-project authorization may cover later runs but never bypasses their review or physical gates.

T19 remains a Jeremy-only measurement card; the orchestrator may assist with its recorded readings and documentation when requested. Never simulate a weeks-long battery result. T20 may be drafted earlier but final closeout waits for T19. Project completion requires all mandatory cards and an explicit implemented/not-needed/deferred disposition for T21.

## Remaining sequence and review gates

| Card | Dependencies | Model · effort | Concrete gate |
|---|---|---|---|
| T14 | T10 | GPT-6.1 Sol · High | Clean PlatformIO build and firmware CI; Jeremy flashes, supplies setup photo and sanitized serial/button readings; confirms upright, unshifted black-on-white display and wire format. |
| T15 | T14 | GPT-6.1 Sol · Medium | QA of provisioning/reset/secret handling; Jeremy tests hotspot, saved credentials, reconnect, and BOOT reset. T16 supplies the complete scheduled deep-sleep integration. |
| T16 | T15, T12 | GPT-6.1 Sol · High | Firmware CI and native schedule/failure tests; Jeremy observes real scheduled wakes, changed/unchanged frames, Wi-Fi failure, and current measurements or a documented measurement limitation. Placeholder battery values remain provisional. |
| T17 | T14, T16 | GPT-6.1 Sol · Medium | Use measured device-loop current, approve pack before purchase, calibrate ADC, rebuild final threshold/hysteresis, and record Jeremy's measurements. No guessed battery capacity claim. |
| T21 | T12 | GPT-6 Luna · High; Sol · High for fallback implementation | Measure a full week of missing/delayed slots and delivery before wakes. Jeremy chooses fallback, not needed, or explicit deferral with risk accepted. Pause before token/service setup; obtain a week of post-change evidence if implemented. |
| T18 | T11, T13, T16, T17 | GPT-6.1 Sol · High | All seven canonical frames plus six CLI fixtures; live bin/PNG/hash checks, state photos and physical tests; resolve/explicitly accept T21 reliability issue; Jeremy signs the report. |
| T19 | T17, T18 | Jeremy; Luna · High for authorized analysis | Full charge, first glyph, stopped-update dates and measured battery report. |
| T20 | T18, T19 | GPT-6 Luna · High; QA Sol · High | Final docs reflect deployed hardware and measured life; Jeremy dry-runs instructions and approves closeout. |

Default firmware path: T14 → T15 → T16 → T17 → T18 → T19 → T20. Run T21 as its own approved task before T18 sign-off; it can be selected earlier when Jeremy wants scheduler reliability investigated. It is not folded into T14.

## Evidence standards

- Canonical container: `./tools/render.sh` invokes `./build.sh`, must print PASS and seven zero-diff rows. CLI fixtures: `./tools/fixture-check.sh`, six byte-identical comparisons. Preserve canonical exports. Run firmware/native commands actually supported by the implemented PlatformIO project and record exact commands; T14 supplies the PlatformIO spike, while later cards extend it.
- Compare raw to its corresponding PNG with `tools/framediff.py`. Normal/low-battery comparison uses `--region 136,281,14,10`; exit 1 is expected for the glyph but outside-region differences must be zero. Seven canonical exports and six CLI fixture checks are different gates.
- Record firmware SHA-256, Git revision, build environment, Jeremy's flashed artifact, sanitized serial excerpts, and photo paths/card attachments. Hash/binary gates verify software; panel photos verify orientation/crop and physical operation.
- T21 distinguishes missing runs from late runs and publish completion from run start. Include the approved 04:47 prepublish, local timezone/DST, and each device wake. A good p95 among runs that happened cannot conceal missing slots.
- Stop on missing credentials/tool access or physical measurements and name the exact unmet criterion. Leave the card In progress with the waiting reason. Do not invent schema statuses or change dependency formulas just to display Ready.
