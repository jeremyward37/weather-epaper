# T15 independent QA — 2026-10-07

**Software: Pass. T15 overall: Pending.** No unresolved software blocker was found in the final source. The implementation is ready for Jeremy's review, conditional on green required CI on the final PR head. Actual radio, phone, power-cycle, deep-sleep, panel/reset observations, Jeremy's acceptance, authorized merge and advancement remain separate pending gates. QA did not flash, enumerate ports, operate hardware, modify production source/tests/exports, or approve a release.

Reviewed [T15](https://app.notion.com/p/3e7d9adbacad812f82cedeb47e813b0b), [PR #20](https://github.com/jeremyward37/weather-epaper/pull/20), README, AGENTS, scope, design setup contract, orchestration/role instructions, final implementation and pinned dependencies. Independent role: GPT-6.1 Sol · High. Source is `b8ae0c4c1680d6fd3857b6d413248e298599d8ee`, based on accepted T14 `08be1ac4024d1c79c25814f0881469804ab096a8`. Later documentation-only commits do not change the audited firmware. The earlier `de113607` builds/hashes and its green CI are superseded as firmware evidence by the final source below.

## Criterion results

| Criterion | Result | Evidence / remaining gate |
|---|---|---|
| First/cleared boot opens required protected AP and Wi-Fi-only portal, `192.168.4.1`, no timeout | Software Pass; physical Pending | Pinned WiFiManager 2.0.17 configuration, exact AP/IP/menu assertions, no-timeout waiting/retry tests. Jeremy must join on a phone, open the page and submit credentials privately. |
| Credentials saved in native NVS; provisioned and lastFrameSha Preferences slots | Software Pass | Explicit FLASH storage initialization; native config authoritative when a save interrupts before provisioned flag; verified submission versus native fixed buffers; metadata committed only after connected. Independent interrupted-save and metadata failure tests pass. |
| Credentials survive power cycle and real deep sleep; long press clears | Physical Pending | Native paths and bounded harness compile; mock storage cannot establish physical persistence. Jeremy must power-cycle twice and observe one actual timer sleep/wake without re-provisioning. |
| Runtime BOOT >=5s reset, short release refresh hook, USER unused | Software Pass; physical Pending | Production controller plus independently compiled ESP timer path: hold/release across 3s blocked portal save yields exactly one reset and no refresh; held wake, debounce, rollover and timer-failure checks pass. No ext0 wake configured in T15. |
| Setup drawn only upon provisioning entry; retained on provisioned reconnect | Software Pass; physical Pending | Saved reconnect avoids display initialization; portal draws once, including reset/restart while already in portal. Native/independent counters verify this. Jeremy must observe no panel refresh/hotspot on saved reconnect. |
| Old frame identity invalidated before setup replaces panel | Software Pass | Checked persistent key absence before drawing/AP. Removal failure retries with BOOT active and no drawing; recovery permits one draw and empty slot. Independent failure/recovery scenario passes. |
| Setup pixels preserved | Pass | Header regeneration byte-identical; extracted 15,000 bytes match canonical setup PNG with zero differing pixels. Approved exports/assets/server/packing code unchanged. T15 physical photo still Pending. |
| No home credentials printed or committed | Software Pass; actual serial Pending | Static application log audit; compile/runtime suppression in pinned WiFiManager/Arduino; IDF default/max logging ERROR; fake-only credential sentinels absent from captured logs in all independent scenarios. Jeremy must provide sanitized real serial evidence. No real credentials were collected. |
| Original four Jeremy checks with serial excerpt | Pending | New T15 normal/harness flash has not been authorized or performed; phone/save/reconnect/long-press observations absent. T14 evidence does not close T15 radio/persistence gates. |
| Clean normal and harness builds; independent QA | Pass | Final source copied to isolated scratch, clean then rebuilt both environments; ten deployed native and fourteen additional independent scenarios pass. |
| Final-head CI, acceptance and authorized merge | Pending | Orchestrator verifies final required CI after QA/packet publication. Explicit Jeremy acceptance/merge remains required. Task stays In progress; no T16 advancement inferred. |

## Final local artifacts

Scratch root: `/private/tmp/weather-epaper-t15-qa`. Both output directories are retained for the orchestrator to copy into frozen self-contained bundles; QA will not rebuild them after this report.

| Environment | App SHA-256 | RAM | Flash |
|---|---|---:|---:|
| `nm-epd-420-bw` | `736c18b0ae031f60d32c1980192d0bc36a9de83fa0afa4f646ba0494a3556b3a` | 63,204 / 327,680 | 1,131,838 / 3,145,728 |
| `provisioning-persistence-test` | `302af824bfe29974268d555605b6acb756945d4f16f13f93471d203d05a4fbd2` | 63,300 / 327,680 | 1,139,498 / 3,145,728 |

Frozen bundles are `/private/tmp/weather-epaper-t15-artifacts/b8ae0c4c1680d6fd3857b6d413248e298599d8ee/{nm-epd-420-bw,provisioning-persistence-test}`. Independent final packet checks matched SOURCE_REVISION and all five SHA256SUMS entries in each bundle. The packet commands are gated for Jeremy after explicit approval.

Outputs: `firmware/.pio/build/<environment>/firmware.bin`, `firmware.elf`, `bootloader.bin`, `partitions.bin`. The required fourth flash image is the pinned `framework-arduinoespressif32/tools/partitions/boot_app0.bin`; the orchestrator copies and hashes it in each frozen bundle. Do not use the offline `qa-merged.bin` as a reviewed app or replace a bundle's components with another environment's files.

Toolchain: PlatformIO Core 6.1.18, esp-idf-size 1.6.1, pioarduino 54.03.21, Arduino 3.2.1, WiFiManager 2.0.17, GxEPD2 1.6.8, GFX 1.12.1, BusIO 1.17.4. Cached pinned packages/libraries were copied/reused; firmware and all framework/library objects were compiled clean in separate QA outputs. Clean dependency download from an empty runner remains the CI gate.

The scratch `source-manifest.json` contains SHA-256 for all 22 firmware files excluding `.pio`; it was checked against the frozen managed worktree after the final builds. Manifest SHA-256: `73896c09eef06ebf524e567e7938203cd043fb8aae3fdcd700c1fc8377134abb`. Main source SHA: `a40493d6095ba9f1de5cd37086f25bef1a5a9d6f7738140b8281924239a892c6`; provisioning source SHA: `e09a77a44835ff15077f8de1cb83091232e40d8a4962ef4a3c92653aea5f03ca`.

## Commands and evidence

All mutation/output checks below ran only in `/private/tmp/weather-epaper-t15-qa`, copied after implementation freeze. Native fakes and additional tests are retained in that scratch directory; they are not committed production tests.

```sh
cd /private/tmp/weather-epaper-t15-qa
sh firmware/test/run-native.sh
sh independent/run.sh
PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t14-pio /private/tmp/weather-epaper-t14-venv/bin/pio run -d firmware -e nm-epd-420-bw -e provisioning-persistence-test -t clean
PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t14-pio /private/tmp/weather-epaper-t14-venv/bin/pio run -d firmware -e nm-epd-420-bw -e provisioning-persistence-test
/private/tmp/weather-epaper-t14-venv/bin/python independent/check-images.py
/private/tmp/weather-epaper-t14-venv/bin/python independent/check-packet.py
/Users/jeremyward/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server/bin/pack-setup.js
/Users/jeremyward/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/framediff.py setup-frame.bin design/exports/states/state-setup.png --out /private/tmp/weather-epaper-t15-qa/setup-diff.png
```

Final clean log: `clean.log`; build log: `build-final.log` (both SUCCESS, no compiler warning match; 30.784s normal, 30.135s harness). Native suite: ten PASS scenarios (button, saved, timeout, reset, held-wake, portal, portal-reset, failed-save, frame-invalidation, metadata-failure).

Independent `independent/run.sh` compiles the deployed provisioning.cpp with `c++ -std=c++17 -Wall -Wextra -Werror -DARDUINO_ARCH_ESP32 -Iindependent ...`, exercising the production ESP timer branch using a separately written timer/storage/radio model. Fourteen PASS scenarios are saved in `independent/results.log`: interrupted-save, reset-order, reset-remove-failure, frame-metadata-failure, frame-invalidation, stale-save, blank-ssid, max-field-lengths, timer-save-block, timer-short-press, timer-held-wake, timer-create-failure, timer-start-failure and read-failure. The model invokes the 5ms timer through a blocked 3s portal delay, then releases a >=5s hold before process returns; reset wins, occurs once, and does not produce a refresh. It checks reset-intent commit before SDK erase, old connection rejection after failed save, 32-byte SSID / 64-byte password bounds, and fake-only credential sentinel absence in captured logs. These assertions model API behavior; they do not prove ESP scheduler/radio/NVS behavior on the board.

`independent/check-images.py` uses Click `make_context` for the exact top-level and `write-flash` command contexts, invokes no command callbacks, and replaces serial.Serial with a denial stub. Both environments parse chip esp32s3, baud115200, before no-reset, after hard-reset, compressed write, DIO/80m/16MB and four address/file pairs at **0x0000, 0x8000, 0xe000, 0x10000**. It executes only offline `merge-bin`, checks all four merged ranges byte-for-byte, decodes the partition table and confirms app0 at0x10000 with3MiB capacity, NVS at0x9000, otadata at0xe000 and image size within partition. Results: `independent/images-final.log`. No write-flash was invoked. Offline image-info also confirmed bootloader ESP32-S3 chip9 and both apps as ESP32-S3, DIO80m16MB with valid checksum/hash. Exact flash commands extracted from docs/t15-review.md separately parsed successfully against the frozen bundle files with serial denied; no callback executed.

Header regeneration matched the original bytes. Raw extraction found exactly15,000 bytes, SHA-256 `e8b104eee5f5fefb00255284cde75d3655fffc7343842a09605a183d576c2f46`; framediff returned0 and no bounding box.

Read-only `git diff --check 08be1ac4024d1c79c25814f0881469804ab096a8` passed. Diff review found no changes to approved PNGs, firmware assets/photos/logs, server or packing tools; design/decisions.md records T15 choices only. PyYAML parsed the updated CI workflow and assertions confirmed native tests, both build environments, copied boot_app0 and per-environment hash/source artifacts.

Local full renderer/design verification is **Pending**: Docker info failed because the OrbStack daemon socket is absent. Direct design/verify.py on the scratch copy could not run to completion because generated `.build/svg` files were intentionally excluded; it is not recorded as a Pass. The required pinned-container render, server and design suite remain the final-head CI gate. No host raster re-baseline or export modification was attempted. The orchestrator independently queried and reported both required jobs green for source b8ae0c4 in [run 37676538752](https://github.com/jeremyward37/weather-epaper/actions/runs/37676538752); the final documentation head still requires its own green readback before release/merge.

## Failure-path review and fixed findings

Four P2 issues found during independent review were corrected and rechecked in final source:

1. The sleep harness could report persistence after portal re-provisioning. Its success line now requires savedReconnect; a timer wake needing portal reports FAIL even if later provisioning succeeds.
2. A held/released BOOT could be missed during WiFiManager's blocking save delay. Independent ESP timer sampling latches the event, and the main thread consumes reset immediately after process before accepting a save.
3. WiFiManager's connect=false save callback also fires when native save fails. Private fixed-length submission/native comparisons reject stale config/connection and preserve reset intent; no secret values are logged or committed.
4. Unchecked lastFrameSha removal could leave old image identity after drawing setup. Persistent absence is now verified before draw/AP; failure retries with reset handling rather than accepting stale metadata.

Pinned library review confirms the portal remains active with setSaveConnect(false), its save path still waits despite connect=false, and the 1s timeout bounds that wait in addition to the default2s captive-response pause. Timer sampling captures holds during the pause; applying a reset can wait until library return. Native explicit FLASH storage is necessary because Arduino persistent(true) alone changes a flag without switching an already-initialized RAM storage mode. Current implementation selects FLASH before config/save/erase. A reset-intent tombstone prevents reconnecting old native config after interrupted/failed erase and is cleared only by successful metadata commit after connection.

Logging checks: WM_NODEBUG undefines WM_DEBUG_LEVEL before constructor execution; runtime debug is disabled. CORE_DEBUG_LEVEL=0 removes Arduino Wi-Fi SSID/BSSID verbose event paths. Pinned ESP32-S3 qio_opi sdkconfig sets IDF default/max logging ERROR(1). Application output contains generic static states or the public AP IP. Physical logs still must be reviewed for unexpected output.

## Reviewer and hardware boundary

Jeremy must separately approve the exact normal and harness artifacts before personally flashing them. Confirm hotspot/password/IP, phone save/closure, twice-repeated power-cycle reconnect without draw, short BOOT hook, >=5s runtime BOOT clear, continued hold without repeated redraw, USER inactivity, wrong-submit retry and saved-network failure behavior. Observe the harness's one timer sleep and saved reconnect without portal/redraw, then restore the frozen normal bundle. Record actual flashed hashes, sanitized serial and setup photo; any persistence FAIL line remains a failure even after manual re-provisioning. No battery is present; USB testing makes no battery-life claim.

Initialization currently starts BOOT sampling after the bounded up-to3s serial wait. Runtime handling is covered; T16 must start sampling before serial/wake-processing delays when integrating ext0 wake. T15 implements no weather fetch, scheduled sleep or ext0 wake. Software Pass does not approve flash, close physical criteria, merge, mark the card Done, or authorize T16.
