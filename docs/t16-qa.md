# T16 independent QA — 2026-10-07

**Software Pass; physical acceptance and release Pending. No unresolved blocking defect found.** Independent role: GPT-6.1 Sol · High. Audited source `068113577d1739da8b7ac13cfc77dec5d3b7d7c6`, base merged T15 `637c2751c740f1a6dfe939a45acece1f09e5b74f`. Exact Git archive and all outputs are in `/private/tmp/weather-epaper-t16-qa/`. Production source, Git, Notion, worklog/state, approved exports, frozen bundles and hardware were not modified. Only scratch adapters/tests were extended.

## Acceptance verdict

| Criterion | Verdict | Evidence and limits |
|---|---|---|
| Native tests and firmware build in CI | Pass on source revision | Independent shell suite25 Pass invocations, PlatformIO native1 Unity Pass, three independent clean builds. Root independently queried source CI37696744465: both required jobs Success. Final documentation head still requires green checks. |
| Schedule/DST, early join and final22:00 target | Software Pass | Deployed schedule tests plus29,220 cases against an independent IANA America/Denver calendar oracle2024–2031. Actual main handles late final-slot NTP with RTC, next05:00 and obsolete-target skip. Real wake accuracy remains Pending. |
| Bounded verified TLS, HTTP framing, buffer size | Software Pass | Actual net.cpp executed with controlled DNS/TLS adapters; fixed deadline, late callbacks, allocation/queue/DNS/write/read failures, partial/trickled data, complete-body/no-EOF stall, malformed/control/duplicate/status/short/extra responses. Host preflight is separate from ESP32 verification. |
| Hash/no-redraw/failure and durable reset ordering | Software Pass | Actual main.cpp tests: no driver initialization on identical/network/hash failures; checked pre-invalidation; A/B/A; first-refresh double commit failure; interruption immediately after first glass refresh retains pending state through25 failed wakes; reset after refresh prevents downloaded SHA commit. |
| BOOT, metadata and sleep outputs | Software Pass | Additional tests compile actual provisioning.cpp with ARDUINO_ARCH_ESP32 and a controlled5ms timer. A hold/release during15s blocked work causes exactly one reset, clears new metadata, and later real short press survives ext0 suppression.16 raw +16 calibrated conversions, hysteresis, hold/release and ext0 configuration independently exercised. |
| Frame bytes/polarity and canonical preservation | Software Pass | Regenerated setup header byte-identical; extracted15,000 bytes vs canonical setup PNG: zero differing pixels.69 source/config/workflow/export files match archive and live worktree. RAM download uses pgm=false, embedded setup pgm=true; pinned400×300 driver uses invert=false/mirror_y=false. |
| Correct actual wakes across at least one hour | Pending | Requires approved T16 production flash, real timer/target/wall-clock traces and Jeremy observations. Two quick debug cycles are insufficient. |
| Actual frame matches index, changed/unchanged/Wi-Fi loss | Pending | Requires flashed identity, whole-panel comparison and actual behavior observations. Fakes/builds do not establish radio, TLS or glass fidelity. |
| Measured sleep current OR documented reason unavailable | Pending | Requires actual arrangement/reading or Jeremy's stated limitation. USB/no pack/ADC0 is not a battery-current or charge measurement. |
| Jeremy acceptance, release/merge and advancement | Pending | This QA does not authorize flash, merge, acceptance or T17. |

## Checks and exact commands

Working directory for the following: `/private/tmp/weather-epaper-t16-qa`.

```sh
sh firmware/test/run-native.sh
PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t14-pio /private/tmp/weather-epaper-t14-venv/bin/pio test -d firmware -e native
PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t14-pio /private/tmp/weather-epaper-t14-venv/bin/pio run -d firmware -e nm-epd-420-bw -e wake-debug -e provisioning-persistence-test -t clean
PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t14-pio /private/tmp/weather-epaper-t14-venv/bin/pio run -d firmware -e nm-epd-420-bw -e wake-debug -e provisioning-persistence-test
c++ -std=c++17 -Wall -Wextra -Werror -Ifirmware/test/runtime -Ifirmware/src firmware/src/schedule.cpp firmware/test/runtime/qa_main.cpp -o qa-main
./qa-main
c++ -std=c++17 -Wall -Wextra -Werror -Ifirmware/test/runtime -Ifirmware/src firmware/test/runtime/qa_net.cpp -o qa-net
c++ -std=c++17 -Wall -Wextra -Werror -DARDUINO_ARCH_ESP32 -Iindependent firmware/src/provisioning.cpp independent/qa_timer.cpp -o independent/qa-timer
/private/tmp/weather-epaper-t14-venv/bin/python independent/qa_images.py
/Users/jeremyward/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server/bin/pack-setup.js
cmp firmware/assets/setup_frame.h setup-frame-original.h
/private/tmp/weather-epaper-t16-image-venv/bin/python tools/framediff.py setup-frame.bin design/exports/states/state-setup.png
```

New T16 logs: `native-baseline.log`, `pio-native.log`, `pio-clean.log`, `pio-build.log`, `independent-main.log` (9 additional deployed-main cases), `independent-net.log` (20 additional deployed-net cases), `independent-timer.log` (3 additional ESPtimer cases), `independent-t16-schedule.log`, `independent-t16-workflow.log`, `independent-t16-images.log`, `setup-regeneration.log`, `setup-framediff.log`. Added test sources retain case names and exact assertions. Schedule bridge was compiled with `c++ -std=c++17 -Wall -Wextra -Werror -Ifirmware/src firmware/src/schedule.cpp independent/qa_schedule_bridge.cpp -o independent/qa-schedule`; independent Python zoneinfo supplied daily boundary cases. Ruby standard YAML parsed the workflow and checked native commands, all three builds and24 uploaded artifact paths. Read-only `git diff --check` on base→source passed.

`./tools/render.sh` locally exits2: Docker daemon unavailable (`renderer.log`). Local container render/fixture repetition is Pending; source CI build Success provides the canonical renderer/fixture gate. No design change/re-baseline occurred. No test or check was weakened. Initial scratch harness compile/setup mistakes were corrected in adapters; no production repair was needed during this executable audit.

## Clean builds and frozen artifact reconciliation

| Environment | RAM bytes | App flash bytes /3,145,728 | App file bytes | Independent clean app SHA-256 |
|---|---:|---:|---:|---|
| nm-epd-420-bw |64,804|1,320,026|1,320,544|`ae5cc780fd00446f171419362010c09e647172e33cf6980075491c632d306c34`|
| wake-debug |64,804|1,320,010|1,320,528|`39944929c1f474785f351ddffa28e773da45160c763395ffe54e933021eec77f`|
| provisioning-persistence-test |64,044|1,156,186|1,156,688|`ec024790002b941f55d07331394ef331dc1f4212efe2091dc857e1a7a7366c51`|

The proposed frozen writer bundles remain at `/private/tmp/weather-epaper-t16-artifacts/068113577d1739da8b7ac13cfc77dec5d3b7d7c6/`. Independently verified source and all five hashes for every environment. Their app hashes are production `17122de56f655b7b37bcc3464f310416ec8b48e189730157e95b9b9a0bc29957`, debug `831e1ebe292c0faec4a0d10d55a5a2a8f052ec2c928fdb3618a5b26d375af893`, harness `b5f4472fb0476316bbd83a800f3a8908bf9e1337b2a31729f875a5f684923268`.

Independent builds differ only in embedded compile timestamps and the ELF identity: all image segments/code/data compare identically after normalizing those fields (38/38/37 differing payload bytes). No source mismatch or unexplained executable difference. Do not substitute independent rebuilt binaries for the proposed frozen bundle.

Offline checks passed: ESP32-S3 chip9, DIO80m/16MB headers; app0 offset0x10000/size0x300000; NVS0x9000 and otadata0xe000; bootloader/partition/boot_app0/app fit without overlap. Offline merge-bin output contains each original component at0/0x8000/0xe000/0x10000; boot_app0 equals the pinned framework. Exact packet default-reset115200 and manual no-reset variant were parsed by installed Click contexts with serial.Serial denied and command callbacks never invoked. Generic README460800 underscore aliases also parse; they emit deprecation warnings, while the concrete packet uses current hyphen spellings. No write-flash was run.

## Source-traced limits

Pinned ESP-IDF5.4.2 TLS source maps peer-close-notify to zero; EOF handling is correct. common_name feeds mbedtls_ssl_set_hostname and bundle attachment selects VERIFY_REQUIRED. Pinned SDK enables full roots and RTC/high-resolution time. Host certifi success alone cannot prove the device bundle validates its network chain. Network deadlines use5ms polling and normal call/cleanup overhead, not hard real-time guarantees.

The pending marker conservatively means uncertain panel state, not confirmed display. Driver BUSY completion/timeout detection cannot prove pixels. GxEPD2's initial write can add a white clearing refresh before the full image. Five-second BOOT events remain latched during bounded work; reset application is deferred until that work returns. A held/stuck LOW BOOT deliberately keeps the device awake. Credentials are never passed into application logs; WM_NODEBUG, CORE_DEBUG_LEVEL0, runtime debug-off and SDK log suppression are present; independent timer logs exclude credential sentinels.

The packet transparently reports provisional battery policy, potentially old published footer, separate T21 punctuality issue, production-hour requirement and all remaining human gates. Software is ready for Jeremy review; no hardware result is inferred.
