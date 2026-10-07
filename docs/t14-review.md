# T14 review packet — USB bring-up

Task: [T14](https://app.notion.com/p/3e7d9adbacad812ca47ddfc930e4a38b) · [PR #19](https://github.com/jeremyward37/weather-epaper/pull/19).
Status: **In progress, awaiting Jeremy review and hardware evidence**. Prepared 2026-10-07. No board connection, upload, physical measurement, acceptance or merge was performed by agents.

## Reviewed software and evidence

Implementation source: `4ac387dbbbb3672b11672222f360a83804c8d615`, based on merged main `6887c8413abe53e705b5fc1ec6cacae30771229a`. Subsequent PR edits record QA, corrected progress snapshots and this review packet; firmware/config/workflow sources are unchanged. Check the latest PR head and its checks before authorizing flash. Current source-revision CI [run 37664544568](https://github.com/jeremyward37/weather-epaper/actions/runs/37664544568) passed both **build** and **firmware**. The final documentation revision must also pass both jobs.

The spike transfers the approved 400×300 setup framebuffer directly, full-refreshes and hibernates the panel, then prints ADC and button levels every two seconds while the ESP32 stays awake. It disables unused peripherals and radio power. The setup text describes a future hotspot; this spike has no Wi-Fi. Continuous USB is suitable for this bring-up. No pack is present, so its ADC readings cannot establish battery voltage or charge level.

Independent QA: separate `epaper_qa` (GPT-6.1 Sol · High), available software checks Pass, no blocking firmware defect. [Full independent report](t14-qa.md) is the audit snapshot; CI was pending when authored and subsequently passed as linked above. The QA clean rebuild produced the frozen app listed below; QA also rechecked the final documentation, all five bundle hashes and nobuild commands with a narrow Pass. [Hardware record](../firmware/HARDWARE.md) distinguishes documentary/software facts from physical findings.

| Criterion / gate | Evidence | Result |
|---|---|---|
| Embedded setup matches export | 15,000 bytes; independent framediff 0 pixels; clean header regeneration | Pass |
| Clean firmware build and CI job | Independent clean PlatformIO build; firmware CI success | Pass on source revision; recheck final PR head |
| Existing renderer/server regression gates | CI build: pinned build/verify, 7 zero-diff frames, 6 byte-identical CLI fixtures and tool/design/server tests | Pass on source revision; recheck final PR head |
| HARDWARE.md | Pins, GYE042A87 driver, ADC, power/charger sources, explicit pending observations | Pass |
| Setup photo and physical wire format | Actual panel orientation/polarity/alignment/crop; record findings in scope/decisions | Pending Jeremy |
| Serial ADC and both buttons | Actual USB-only empty-connector samples and HIGH→LOW→HIGH transitions | Pending Jeremy |
| Independent software QA | Separate review and meaningful rerun | Pass |
| Jeremy flash/review acceptance and authorized merge | Explicit human approval and physical evidence | Pending |

## Frozen artifact

Local bundle: `/private/tmp/weather-epaper-t14-artifacts/4ac387dbbbb3672b11672222f360a83804c8d615/`.

App: `firmware.bin`, 472,272 bytes, SHA-256 **`197954ed939d99b47ab43c8115749adb3fe8078ff43f5075bb58c5717018589d`**.
The bundle also preserves `bootloader.bin`, `partitions.bin`, `firmware.elf`, the pinned vendor `boot_app0.bin`, `SHA256SUMS` and `SOURCE_REVISION`. Local build files remain in `/private/tmp/weather-epaper-t14/firmware/.pio/build/nm-epd-420-bw/`. Use the local frozen artifact for the steps below; CI's Linux app can have a different hash. A fresh build changes the review artifact; record and review its new hash before use.

Build environment: PlatformIO 6.1.18, pioarduino 54.03.21, Arduino-ESP32 3.2.1, GxEPD2 1.6.8, GFX 1.12.1, BusIO 1.17.4, esp-idf-size 1.6.1, 16 MB flash/DIO and 8 MB OPI PSRAM, 80 MHz CPU. Clean build RAM 37,336 bytes, application flash 471,870 bytes. The compatible size-helper pin resolves the vendor `--ng` warning; the unmodified vendor installer also uses `~/.platformio/tools`.

## Needs Jeremy

First review PR #19 and the source/artifact above, then explicitly approve this **T14 flash**. That approval does not approve merge or advancement to T15. After approval:

1. Keep the battery connector empty. To bypass the existing Meshtastic app during the first connection, hold **BOOT** while plugging USB into this Mac and the device; release BOOT after connection. Discover the ROM USB port with the command below. Do not hold BOOT during normal startup or subsequent button tests.
2. In Terminal use the prepared checkout and tool; list ports:

   ```sh
   cd /private/tmp/weather-epaper-t14
   export PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t14-pio
   /private/tmp/weather-epaper-t14-venv/bin/pio device list
   shasum -a 256 firmware/.pio/build/nm-epd-420-bw/firmware.bin
   ```

   The app hash must be `197954ed939d99b47ab43c8115749adb3fe8078ff43f5075bb58c5717018589d`. If it differs, stop and return the hash; do not flash an unreviewed rebuild.
3. Substitute the actual `/dev/cu.usbmodem...` port in both fields below. Close any other serial monitor. This uses **nobuild** to upload the existing reviewed binary and pinned boot components, then opens the serial monitor:

   ```sh
   /private/tmp/weather-epaper-t14-venv/bin/pio run -d firmware -e nm-epd-420-bw -t nobuild -t upload -t monitor --upload-port /dev/cu.usbmodemPORT --monitor-port /dev/cu.usbmodemPORT
   ```

   USB may renumber after upload. If monitoring fails, exit with Control-C, reconnect USB with BOOT released, list ports again, and use:

   ```sh
   /private/tmp/weather-epaper-t14-venv/bin/pio device monitor -d firmware -e nm-epd-420-bw --port /dev/cu.usbmodemPORT --baud 115200
   ```
4. Let the black/white refresh finish and the setup image settle. Take a straight-on photo including every panel edge. Compare with `design/exports/states/state-setup.png`: upright text/logo, black on white, no mirror, crop, shift or missing columns. Return the photo and your assessment; canonical storage is `firmware/photos/t14-setup.jpg` and an attachment on the T14 card.
5. Return several no-pack serial lines with both buttons released. Hold **USER** three seconds, release three seconds, then hold **BOOT** three seconds and release. Both should show `1 → 0 → 1`. T14 only reports buttons; they do not provision Wi-Fi yet. Retain actual ADC readings plus the explicit context **USB-only, battery connector empty**. They may be zero or nonzero; no-pack values are not battery state of charge.
6. Return startup Flash/PSRAM lines if visible: expected `Flash=16777216 PSRAM=8388608`, and any `Busy Timeout!`, reset loop or display defect. If startup logs were missed, periodic diagnostics continue; recovery steps are in [firmware README](../firmware/README.md). Record the source revision/app hash actually flashed.

After evidence arrives, the orchestrator evaluates it and records the physical wire format. T14 remains In progress until every criterion passes, Jeremy explicitly accepts the result, and merge is authorized with green CI. T15 requires separate advancement authorization.

## Stop / rollback and limits

Before upload, stop by leaving the board untouched. After upload, close the monitor and unplug USB to stop the spike; e-paper retains its image. Restoring prior Meshtastic behavior requires an explicitly chosen known firmware image; no factory backup was captured. Do not automatically erase flash, alter server packing or edit the approved PNG. Return failures for a reviewed correction and repeat physical evidence.

Local Docker was stopped, so canonical regression evidence comes from CI. No actual panel/ADC/button/flash/PSRAM observation has been substituted by compilation. Battery calibration and life remain pending the pack expected in early November; T14 does not claim those later gates passed.
