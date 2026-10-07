# T16 corrected upload and early-runtime QA

Independent read-only evidence audit, 2026-10-07; cutoff actual runtime `2026-10-07T23:27:38.173Z`. No serial/device access, source changes, Git/Notion writes or monitor execution by QA. Reviewed source `3fc1e59235b4fc3b456c2b6d75aa380965899cc1`; approved production app SHA256 `4d9e35cfeaf3b712abc5eb2737b95fcd4c5e3d45bd077f2c8c031df977e8a648`,1320576 bytes. Parent records reviewed head `847c8b1a494e3a6cc8cf0300f7977625d3a6db70`, both required CI SUCCESS run37701828781 and Jeremy's corrected-flash/manual-BOOT authorization; this audit does not independently query CI or human-message provenance.

| Available criterion/evidence | Verdict | Limits |
|---|---|---|
| Correct approved frozen source/bundle | Pass | SOURCE_REVISION/all5checksums and explicit app SHA independently reread. |
| Same board and actual four-image flash | Pass | Flash reports ESP32-S3v0.2/8MBPSRAM MAC28:84:85:9f:0e:fc; observer same serial2884859F0EFC at application port114101. Four write hashes verified,1320576 app bytes at0x10000, FLASH_EXIT=0. |
| Actual command/settings/scope | Pass | Exact logged no-reset/manual-ROM, hard-reset,115200,DIO80m16MB command parses with serial denied and callbacks uninvoked. Four offsets0/0x8000/0xe000/0x10000, no broad erase. No debug/harness upload. |
| NVS preservation | Pass within evidence | Partition NVS0x9000..0xdfff lies outside every logged erased/written range; saved credentials reconnect in actual runtime. No claim of byte-for-byte flash/NVS readback. |
| Host endpoint snapshot | Pass | All6captured files status200/size/SHA match snapshot; all5metadata hashes match. Both bins15000. Both raw↔PNG comparisons zero pixels with tools/framediff.py. Trust verification is recorded by host capture; QA reread supplied evidence without new network access. |
| Corrected hardware startup success path | Pass for observed path | Cold-immediate23:27:23.623Z; saved Wi-Fi4103ms; NTP4346ms; accepted15000lowbat1188ms; display4694ms changed-refreshed-hibernated-sha-saved at23:27:38.060Z; scheduled sleep122s/target1791415800/debug0 then USB disappears. Source logs SHA success only after verified64-byte Preferences put/read and successful active display check. No failure line in captured startup. |
| Corrected real timer wakes across>=onehour | Pending | This is cold startup, not timer evidence. No corrected TIMER wake in audit cutoff. Planned lead wake is17:29:40MDT for nominal17:30 target; actual wake still needs capture. |
| Whole-panel/index fidelity; changed/unchanged/offline behavior | Pending | Panel answer/photo/index comparison outstanding. Successful BUSY/SHA and host frame identity do not prove glass pixels or later no-refresh/offline retention. Device does not print the fetched hash; host snapshot cannot alone prove the exact device-visible frame. |
| BOOT/USER/reset checks | Pending | Manual ROM preparation is not a runtime BOOT/USER/long-clear test. |
| Sleep-current alternative | Previously documented reason | Jeremy: no suitable meter available, continuous USB/no pack. No measured current/battery-life/charge claim. |
| Acceptance/merge/T17 | Pending | Corrected flash/test authorization does not accept or merge T16 or advance tasks. |

Actual evidence: `/private/tmp/weather-epaper-t16-corrected-production-flash.txt`, `...-runtime.txt`, `/private/tmp/weather-epaper-t16-corrected-hardware-live/verification.json` and captured bin/PNG/meta. Host snapshot23:25:56Z footer `10/7 5:05 PM`; lowbat SHA `4c99fa46b9692bb30fc00f1686deda7b27e65f845ebb0aae3547e3be899d3d33`. This supersedes the older11:49AM host snapshot for this observation only; no hosting mutation occurred in QA.

Observer omits DTR/RTS ioctls and disables HUPCL but attachment/USB host behavior is not universally reset-free. A USB reattach/cold-immediate sequence does not prove which reset mechanism caused it; parent reports normal RESET requested. USB disappearance plus the sleep log supports sleep entry, not measured current or successful future wake. Use actual outcome=timer and host timestamps for scheduled wake evidence. Bounded observer may collect subsequent data; this report deliberately does not wait an hour or pass later observations by assumption.

Checks executed: frozen SHA/SOURCE_REVISION reread; logged command parsed with installed esptool Click contexts and serial.Serial deny stub; partition ranges compared with actual logged erase ranges; local snapshot bytes/meta hashes reread; bundled Python tools/framediff.py comparisons for both bin/PNG pairs; actual updated runtime read and deployed log-success predicate inspected. No device operation executed.

**Verdict: actual corrected upload, host snapshot and observed cold-start corrected display/SHA success path Pass. Original hour/fidelity/unchanged/offline and remaining physical/release criteria Pending.**

## Narrow BOOT / unchanged-frame addendum

Evidence reread through `2026-10-07T23:28:22.973Z`. Parent supplies Jeremy's actual answers: “Reset done—weather is visible” after normal RESET, and “Yes—screen stayed unchanged without flashing” in response to the brief BOOT-from-sleep/no-redraw check. QA did not independently receive button timing or view a new panel photo.

| Narrow check | Verdict | Evidence/limits |
|---|---|---|
| Brief BOOT wakes sleeping production and attempts immediately | Pass | Actual `BOOT-immediate` at23:28:19.067Z on same board after prior USB-disappearing sleep; verified fetch completes23:28:22.866Z, before nominal17:30 target. Runtime maps ESP_SLEEP_WAKEUP_EXT0 to this label; GPIO0 is the only configured ext0 source. This is a button wake, not a TIMER wake or timed long-hold test. |
| Identical fetched frame skips redraw after saved SHA survives sleep | Pass for this observed wake | Saved Wi-Fi1836ms, NTP686ms, accepted15000lowbat1179ms, `identical-no-redraw` display1ms at23:28:22.871Z; source takes this path before display initialization. It follows the earlier successful SHA save and actual sleep/wake. Jeremy confirms unchanged screen without flashing. |
| Visible corrected weather startup | Human confirmation supplied | Jeremy reports weather visible; whole-panel/index fidelity remains Pending. |
| Return to production scheduling | Sleep-entry evidence | Sleep78sec,target1791415800/debug0 at23:28:22.931Z; USB disappears23:28:22.973Z. Actual subsequent timer wake remains Pending at this read cutoff. |

No corrected TIMER line appears by this read. Full production hour, full-panel fidelity/index comparison, scheduled Wi-Fi loss/recovery, USER no-wake behavior and deliberate long-clear/re-provision remain Pending, as do independent final hardware reconciliation and explicit acceptance/merge. The earlier corrected-startup/host/upload verdict remains valid. The work-in-progress `docs/t16-corrected-hardware.md` still says the brief-BOOT answer/trace pending and should update that narrow sentence as root records this addendum; its remaining limits are appropriate. No timer/hour or panel-photo pass is inferred from these two human answers.

## First corrected production TIMER addendum

Actual live trace reread through `2026-10-07T23:30:01.535Z`; same-board reattach23:29:41.047Z then actual `outcome=timer`23:29:41.048Z (ms617). This is independent evidence of one timer wake, not a cold/USB reset. The logged attach/wake is18.952seconds before the nominal17:30MDT/23:30UTC target, consistent with the approximate20-second planned lead after boot/USB enumeration delay; it is not an exact oscillator measurement.

Saved Wi-Fi1849ms and fresh NTP1741ms complete before the target. Fetch completes23:30:01.230Z with reported duration1197ms and `accepted-15000-lowbat`; subtracting the reported duration places the request start about23:30:00.033Z, consistent with waiting until the target. Display23:30:01.242Z reports `identical-no-redraw`,1ms. Sleep23:30:01.292Z records1779seconds,target1791417600/18:00MDT,debug_interval0; USB disappears23:30:01.535Z.

**Pass for one observed corrected production timer cycle:** timer wake/early join, target-aligned verified fetch, unchanged-SHA skip and next production schedule entry. Fresh physical no-flicker testimony for this TIMER cycle was not supplied; the existing human no-flicker answer applies to the earlier BOOT cycle. No scheduled Wi-Fi-unavailable test occurred: Jeremy deferred it because it would disrupt others. Keep that test Pending, not waived or failed. Only one corrected nominal timer slot is captured so far; one-hour scheduled coverage, full-panel/index fidelity, USER/long-clear, final hardware reconciliation and acceptance/merge remain Pending. Observer remains parent-operated; QA did not access it or wait for more slots.
