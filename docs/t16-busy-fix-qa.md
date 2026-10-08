# T16 BUSY phase correction — independent QA

Audited source: `3fc1e59235b4fc3b456c2b6d75aa380965899cc1`, archived into `/private/tmp/weather-epaper-t16-busy-final-qa`. Independent QA: GPT-6.1 Sol · High, 2026-10-07. **Software correction Pass; corrected flash approval, corrected-head CI, original physical criteria and acceptance/merge remain separate gates.** No hardware/device access or tracked-file mutation performed by QA.

The installed original0681135/app17122de5 artifact exposed a real software defect. Actual cold runtime completed display in4687ms, below the9.99s BUSY latch, then incorrectly rejected BUSY HIGH after hibernate. Pinned GxEPD2 1.6.8 sends SSD1683 command0x10/data0x01 there. The [original Solomon SSD1683 datasheet, printed page25/PDF index24](https://files.seeedstudio.com/wiki/Other_Display/42-epaper/IC%20Driver%20SSD1683%20Datasheet.PDF) explicitly specifies HIGH during deep sleep. Arduino3.2.1 pinMode preserves the existing interrupt type. This trace is not evidence of an active controller timeout. Jeremy reports weather visible; that alone does not establish full-panel pixel fidelity.

The earlier068 independent report's no-blocker conclusion is superseded for this defect: its driver fake forced LOW during hibernate and missed the controller contract. Prior unaffected source checks remain evidence; physical gates were never passed. The correction calls pinned powerOff, samples awake BUSY LOW plus the existing timeout latch before hibernate, then retains the latch in its return. Driver full refresh already marks power off; the explicit call is idempotent and ensures any remaining power-off wait precedes sleep.

| Criterion/check | Result | Evidence/limit |
|---|---|---|
| Correct sleep BUSY contract and active completion guard | Pass | Pinned driver/datasheet/source trace; only main.cpp and two runtime tests changed in firmware/config/tests/workflow/design from068. |
| Committed native regression suite | Pass | 25 scenario/suite invocations, `native-committed.log`; real deployed main/parser/net/provisioning code. |
| Independent affected failure checks | Pass | Six deployed-main checks: activeLOW→sleepHIGH success; power-off activeHIGH rejection without latch; power-off timeout followed by recoveredLOW rejection; refresh timeout followed by recoveredLOW rejection; late latch rejection; successful committed SHA skips the next sleepingHIGH panel. `/private/tmp/weather-epaper-t16-busy-qa/independent-busy.log`. |
| Regression sensitivity | Pass | Same realistic fake fails when only show() is restored from068 (expected assertion abort), and passes corrected show(). `/private/tmp/weather-epaper-t16-busy-qa/sensitivity.log`. |
| Independent clean production compile | Pass | 37.84s; RAM64804, flash1320054/3145728; file1320576. `clean-production.log`, `build-production.log`. Writer separately completed clean normal/debug/persistence builds. |
| Source, flags, dependencies and approved assets | Pass | Archive/live source/config/workflow/canonical exports match:69 files. Root/independent pinned library source/header/manifest match:471 files. Framework/platform/toolchain share the same pinned core; config/build_flags identical. `dependencies-manifest.log`, `images.log`. |
| Frozen bundles and exact packet CLI | Pass | All five file hashes in all3 environments and root manifest/source/app sizes verified. S3 chip9, DIO80m16MB; partition fit; four ranges0/0x8000/0xe000/0x10000; offline merge-bin. Exact current production/default-reset and manual/no-reset commands parsed with serial denied and no callbacks. Generic README legacy aliases also parse. `images.log`, `qa-busy-images.py`. |
| Required corrected final-head CI | Pending | Root must record both green jobs on the exact final review head; original068/da21 CI is historical. |
| At least one hour of correct production wakes | Pending | Installed original release has only one captured real timer slot, not one hour; correction unflashed. |
| Matching index/full panel and changed/unchanged/offline behavior | Pending | Original verified fetch and human-visible weather are initial evidence. False rejection withheld SHA, so its subsequent refresh is not a passed unchanged-frame check. Corrected artifact needs approved physical testing and panel comparison. |
| Sleep current OR documented inability to measure | Pass for allowed alternative | Jeremy's recorded reason: no suitable meter available; continuous USB/no pack. No current, battery life or charge claim. |
| Corrected artifact flash approval; acceptance/merge/T17 | Pending | Original approval covered068/app17122 only. No new artifact approval, merge or task advancement inferred. |

Reviewed frozen production: `/private/tmp/weather-epaper-t16-artifacts/3fc1e59235b4fc3b456c2b6d75aa380965899cc1/nm-epd-420-bw/firmware.bin`,1320576 bytes, SHA256 `4d9e35cfeaf3b712abc5eb2737b95fcd4c5e3d45bd077f2c8c031df977e8a648`. Debug1320560 SHA `1d36af665b771f43e69a35f339b3ff2a052667643404c6bd97202a43635c7125`; persistence1156720 SHA `374320ec2949ddebada049bfcc3eb7cb76d609c668b8ad7dfd5676c9a311cca7`. Debug/harness are comparison artifacts, not proposed production flashes.

The independent clean production image SHA is `6854efdb3ef01e3f0a2bdf1ab6fea8827b62828cef9c7e6c8c6647c7ada67b2d`. It has the same size/resource metrics and reviewed source/config/dependency identities, but differs from the frozen root binary. Compile metadata/string-pool/layout differences occur; a full byte-normalized identity was not established and is not claimed. QA does not substitute its binary for the reviewed root bundle. Root hashes remain the proposed release identity.

Exact principal commands (scratch cwd `/private/tmp/weather-epaper-t16-busy-final-qa`):

```sh
sh firmware/test/run-native.sh > native-committed.log 2>&1
PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t14-pio /private/tmp/weather-epaper-t14-venv/bin/pio run -d firmware -e nm-epd-420-bw -t clean > clean-production.log 2>&1
PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t14-pio /private/tmp/weather-epaper-t14-venv/bin/pio run -d firmware -e nm-epd-420-bw > build-production.log 2>&1
/private/tmp/weather-epaper-t14-venv/bin/python qa-busy-images.py > images.log 2>&1
```

The six additional checks use scratch `firmware/test/runtime/independent_busy.cpp`, including deployed main through the revised fake with controllable power-off/hibernate hooks; compiled with `c++ -std=c++17 -Wall -Wextra -Werror -Ifirmware/test/runtime -Ifirmware/src firmware/src/schedule.cpp firmware/test/runtime/independent_busy.cpp`. Only scratch adapters/tests were instrumented. Sensitivity restores only old show(); it does not alter reviewed source. No broader repeated schedule/net/renderer checks were needed because those production sources/config/approved assets are unchanged. Existing source CI/renderer evidence remains historical until corrected required CI passes.

No unresolved software blocker in the correction. BUSY LOW remains a conservative completion signal, not proof of pixels or protection against a disconnected/stuck-LOW wire. Jeremy's corrected panel observations and original physical tests remain necessary.
