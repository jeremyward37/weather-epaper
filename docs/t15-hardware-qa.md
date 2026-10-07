# T15 hardware evidence reconciliation — 2026-10-07

Assembled by the root orchestrator from separate epaper_qa (GPT-6.1 Sol · High) read-only evidence audits and Jeremy's actual reports. This supplements, and preserves, the pre-flash software report in t15-qa.md. Audited source b8ae0c4 and both frozen app hashes unchanged. No source rebuild occurred during hardware review.

| Original Notion T15 criterion | Independent verdict | Actual evidence |
|---|---|---|
| Four Jeremy checks recorded with serial | Pass | Verified normal/harness/restore writes; phone save; USB-cycle saved reconnect; long BOOT reset/returned AP and correct re-provision. t15-phone-provisioning.txt, t15-reset-reprovision.txt, flash records |
| Credentials survive power cycle/deep sleep; long hold clears | Pass | Jeremy reports two physical cycles retaining panel; second disconnect/reattach/saved reconnect captured. Harness success requires actual TIMER wake + RTC marker + savedReconnect. Long hold clears to setup/AP/re-provision |
| No credentials printed or committed | Pass for reviewed source and observed captures | Independent logging audit and generic actual runtime logs; no home identifiers/passwords collected |

Additional runtime observations: one short BOOT refresh hook; one reset/setup after Jeremy's ten-second continued hold, no repeated reset; USER caused no visible effect. Exact approved normal restored after harness and remains installed. Observer stopped normally after completion; no continuing serial monitor or automation.

## Limits

- Failed-submission/corrected-retry and saved-network-unavailable are recommended additional physical coverage, not original card criteria. Software tests pass; these physical cases were not run. They do not block the original criteria and are not relabeled Pass.
- Ten seconds is the configured harness sleep interval, not an independently measured timing result. No T16 schedule/ext0 wake or battery-life/current conclusion follows.
- Raw serial omitted DTR/RTS ioctl and disabled HUPCL, but is not guaranteed reset-free on every host. TIMER-only harness success cannot result from a USB reset or portal recovery.
- First physical unplug transition was not captured; Jeremy's panel report and later saved reconnect supplement it. Second physical disconnect/reconnect is directly captured and Jeremy confirms unchanged panel.
- Jeremy re-supplied IMG_2842.JPG. SHA-256 fe30c95d6e9d05e4e06aab4f796bfb203ee00ee2a15512f7571212e024ebe00b matches the accepted T14 photo at firmware/photos/t14-setup.jpg exactly. It is reused visual reference, not a fresh T15 exposure. Approved setup bytes unchanged; Jeremy confirms T15 redraw returned that layout and later cycles retained it. The original T15 card requires no separate fresh-photo criterion; no new-photo claim is made.

Original functional criteria and independent software/hardware audits Pass. Overall release remains In progress until final evidence-head CI, Jeremy's explicit acceptance and authorized merge. No T16 advancement authorization. Review packet t15-review.md records exact artifacts and limits.
