# T15 review packet — Wi-Fi provisioning

Task: [T15](https://app.notion.com/p/3e7d9adbacad812f82cedeb47e813b0b). Branch: `codex/t15-wifi-provisioning`, based on accepted/merged T14 `08be1ac`. [PR #20](https://github.com/jeremyward37/weather-epaper/pull/20). Final firmware/config/test/workflow source: `b8ae0c4c1680d6fd3857b6d413248e298599d8ee`; frozen hashes are below. Status **In progress; software QA Pass; normal flash and persistence test approved; normal firmware flashed; phone save and actual timer-sleep persistence passed; normal restored; awaiting remaining physical reset/reconnect evidence**. T14 was accepted by Jeremy and PR #19 merged; that approval authorizes T15 preparation, not its new firmware release.

## Behavior

The approved setup bitmap is drawn on provisioning entry after the previous frame hash is confirmed cleared. A metadata failure retries with BOOT handling active before any redraw. A password-protected `WeatherStation-Setup` hotspot serves the Wi-Fi-only captive portal at `192.168.4.1`; the public setup password is `firstlight`. Saved credentials reconnect on the next boot without a panel redraw. Setup remains visible until T16 downloads a frame. Runtime BOOT short release invokes a logged T16 refresh hook; a five-second hold clears credentials and returns to setup. USER is unused. Holding BOOT during physical reset enters the ROM downloader instead.

Credentials remain in native Wi-Fi NVS. Preferences stores provisioning/frame metadata and reset intent; home identifiers/passwords are not logged. The approved frames, server, fetch behavior and refresh schedule are unchanged. The normal firmware stays awake on USB. A separate bounded persistence harness enters one ten-second timer sleep after a thirty-second grace period, then verifies saved reconnect without entering setup; it is a distinct artifact, not the T16 schedule.

## Acceptance and QA

| Criterion | Evidence | Result |
|---|---|---|
| Pinned WiFiManager and required API/hotspot/portal | Source review/build plus Jeremy phone submission and actual Provisioning complete serial line in t15-phone-provisioning.txt | Pass |
| BOOT reset and short refresh hook, USER unused | Production-controller tests and t15-boot-reset.txt plus Jeremy panel report: one short hook, one reset/setup after ten-second hold; USER/portal re-entry still pending | BOOT observed; remainder Pending |
| Setup only on provisioning entry; frame identity slot | Source/native checks; setup header must remain byte-identical | Software Pass |
| Credentials survive power cycle and deep sleep | Actual harness saved reconnect after TIMER wake: t15-timer-persistence.txt; independent audit Pass. Earlier power-cycle panel retained reported; directly captured repeat pending | Timer sleep Pass; physical cycle Partial |
| No credentials printed or committed | Source/upstream logging audit and sanitized actual startup/phone serial | Pass for observed runs |
| Original four Jeremy checks with serial excerpts | Flash and phone/save observed; monitor-induced-reset saved reconnect observed; physical power cycle/long press pending | Partial |
| Independent QA and final-head CI | Separate GPT-6.1 Sol · High audit: 10 deployed native scenarios, 14 independent timer/NVS failure scenarios, clean normal/harness builds, header regeneration/zero-pixel framediff, secret-log audit and offline upload checks. Source CI passed; final PR-head CI tracked on GitHub/Notion before release/merge | Software Pass; latest CI gate required |
| Jeremy acceptance and authorized merge | Explicit instruction after evidence | Pending |

## Needs Jeremy

Jeremy explicitly approved **T15 normal firmware flash and the separate persistence test** for reviewed PR head `250ec59` and both exact frozen hashes below; both required CI jobs passed in run 37677877843. His subsequent request that the agent run Terminal commands overrides AGENTS.md rule 13's manual Terminal handoff for these approved operations. The agent completed the normal upload with automatic BOOT entry (`--before default-reset`), exit 0 and all written-image hashes verified. Startup confirmed the setup frame and AP IP 192.168.4.1; see [flash record](../firmware/logs/t15-normal-flash-record.md) and [startup capture](../firmware/logs/t15-first-startup.txt). The agent handles upload/monitor/harness/normal restore; Jeremy handles private phone credentials, buttons, physical power cycles and photos. No repeat approval is needed.

The steps and commands below remain a manual fallback reference; normal flashing is already complete.

The remaining test sequence is:

1. Close the current monitor with Ctrl+C. Discover the serial port. With USB connected, hold **BOOT**, press/release **RESET**, wait two seconds, then release BOOT. Rediscover the ROM port; e-paper can keep its old image during this step.
2. Verify the normal bundle's source revision and all SHA-256 checks, then upload the four explicit address/file pairs: bootloader `0x0000`, partitions `0x8000`, boot_app0 `0xe000`, app `0x10000`, DIO/80m/16MB. Use the frozen-bundle command supplied below. Do not use the broken vendor `nobuild` uploader. Press/release RESET with BOOT released if the app remains in downloader mode; rediscover its application port and open the monitor.
3. Confirm the approved setup frame and `Setup AP IP: 192.168.4.1`. If an existing native config reconnects instead, hold BOOT at least five seconds while the app is running to enter fresh setup. On a phone join `WeatherStation-Setup` with `firstlight`, open `http://192.168.4.1`, and enter home Wi-Fi credentials privately. Expect generic `Trying submitted Wi-Fi` / `Provisioning complete; setup frame retained`, hotspot closure, and the unchanged panel. Return sanitized serial only; do not share home SSID/password or credential-form screenshots.
4. Disconnect/reconnect USB with BOOT released twice. Expect `Saved Wi-Fi connected; panel retained`, no setup-display log, no hotspot and no panel refresh. Keep the battery connector empty.
5. Briefly press/release BOOT: expect one refresh-hook message. While firmware is running, hold BOOT at least five seconds, then release: expect reset, one setup redraw and the portal. A continued hold must not repeatedly redraw; USER should do nothing. Re-provision and confirm another power-cycle reconnect. Also check a wrong Wi-Fi submission remains in setup and permits a corrected submission; saved-network unavailability should enter setup after the bounded reconnect wait.
6. After reviewing its separate hash, flash the persistence harness by the same ROM/hash/offset procedure. Provision if needed. Leave BOOT released: after thirty seconds it enters one ten-second timer sleep. CDC may disappear; rediscover/reopen the application port. Expect `Timer wake reconnected; persistence observed`, retained panel and no hotspot/redraw. A `FAIL timer wake required portal; persistence unproven` message does not pass persistence even if re-provisioning subsequently succeeds.
7. Restore the frozen normal T15 bundle and confirm saved reconnect plus BOOT reset again. Return the actual serial excerpts, whole-panel setup photo and observed outcomes, including which artifact was flashed each time. Tests are Pending until observed.

## Artifacts and exact commands

Source revision for both independent clean builds: **`b8ae0c4c1680d6fd3857b6d413248e298599d8ee`**. Later review/QA records do not alter firmware, config, tests or workflow. [Independent QA report](t15-qa.md) records commands and failure checks. Required source CI: [run 37676538752](https://github.com/jeremyward37/weather-epaper/actions/runs/37676538752); final PR-head checks must also be green before release/merge.

Frozen local bundle root: `/private/tmp/weather-epaper-t15-artifacts/b8ae0c4c1680d6fd3857b6d413248e298599d8ee/`. Each environment folder contains the four flash images, firmware.elf, SHA256SUMS, SOURCE_REVISION and BUILD_VERSION; files are read-only. Root independently matched QA's app hashes and copied the pinned boot_app0 image. These exact local apps are the proposed release artifacts; CI Linux builds can have different hashes. Earlier implementer/QA app hashes are superseded. A rebuild is a different review artifact.

| Environment folder | App bytes | App SHA-256 |
|---|---:|---|
| `nm-epd-420-bw` (normal) | 1,132,240 | `736c18b0ae031f60d32c1980192d0bc36a9de83fa0afa4f646ba0494a3556b3a` |
| `provisioning-persistence-test` (bounded harness) | 1,140,000 | `302af824bfe29974268d555605b6acb756945d4f16f13f93471d203d05a4fbd2` |

Both: PlatformIO 6.1.18, pioarduino 54.03.21, Arduino3.2.1, WiFiManager2.0.17, GxEPD2 1.6.8, GFX1.12.1, BusIO1.17.4, esp-idf-size1.6.1, 80MHz CPU/16MB DIO flash/8MB OPI PSRAM. Clean normal RAM63,204/app-flash1,131,838 bytes; harness RAM63,300/app-flash1,139,498. Firmware fits the 3MB app partition.

Discover ports without opening the device:

```sh
/private/tmp/weather-epaper-t14-venv/bin/python -m serial.tools.list_ports -v
```

Last read-only enumeration: `/dev/cu.usbmodem14101`, USB JTAG/serial debug unit, VID:PID303A:1001, serial28:84:85:9F:0E:FC. Rediscover after ROM/reset/sleep; replace the port in commands if it changes. The following commands are the approved upload reference; the agent may execute them under the recorded Terminal override. Automatic entry uses `--before default-reset`; the shown `no-reset` variant requires manual ROM entry. They validate all five image/ELF hashes and the source revision before any write. They leave NVS untouched; do not add an erase-flash step.

Normal flash, also used to restore normal firmware after the harness:

```sh
(
  cd /private/tmp/weather-epaper-t15-artifacts/b8ae0c4c1680d6fd3857b6d413248e298599d8ee/nm-epd-420-bw &&
  test "$(cat SOURCE_REVISION)" = b8ae0c4c1680d6fd3857b6d413248e298599d8ee &&
  shasum -a 256 -c SHA256SUMS &&
  /private/tmp/weather-epaper-t14-venv/bin/python \
    /private/tmp/weather-epaper-t14-pio/packages/tool-esptoolpy/esptool.py \
    --chip esp32s3 --port /dev/cu.usbmodem14101 --baud 115200 \
    --before no-reset --after hard-reset \
    write-flash -z --flash-mode dio --flash-freq 80m --flash-size 16MB \
    0x0000 bootloader.bin 0x8000 partitions.bin \
    0xe000 boot_app0.bin 0x10000 firmware.bin
)
```

Separate harness flash, only for the reviewed persistence test:

```sh
(
  cd /private/tmp/weather-epaper-t15-artifacts/b8ae0c4c1680d6fd3857b6d413248e298599d8ee/provisioning-persistence-test &&
  test "$(cat SOURCE_REVISION)" = b8ae0c4c1680d6fd3857b6d413248e298599d8ee &&
  shasum -a 256 -c SHA256SUMS &&
  /private/tmp/weather-epaper-t14-venv/bin/python \
    /private/tmp/weather-epaper-t14-pio/packages/tool-esptoolpy/esptool.py \
    --chip esp32s3 --port /dev/cu.usbmodem14101 --baud 115200 \
    --before no-reset --after hard-reset \
    write-flash -z --flash-mode dio --flash-freq 80m --flash-size 16MB \
    0x0000 bootloader.bin 0x8000 partitions.bin \
    0xe000 boot_app0.bin 0x10000 firmware.bin
)
```

After BOOT is released and normal RESET has started the app, monitor the rediscovered application port:

```sh
env PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t14-pio \
/private/tmp/weather-epaper-t14-venv/bin/pio device monitor \
-d /Users/jeremyward/.codex/worktrees/t15-wifi-provisioning/weather-epaper/firmware \
-e nm-epd-420-bw --port /dev/cu.usbmodem14101 --baud 115200
```

Offline QA validated esptool argument parsing while denying serial access, merged-image address ranges, partition fit and bootloader/app headers. That offline QA involved no device access. The subsequent approved normal upload and startup capture are recorded above. On missing AP, credential leakage, boot loops, wrong panel content or Busy Timeout, stop and return sanitized evidence. Existing accepted T14 snapshot remains unchanged at `/private/tmp/weather-epaper-t14-artifacts/4ac387dbbbb3672b11672222f360a83804c8d615/`; recovery is the exact accepted T14 command in [T14 packet](t14-review.md) / [historical bring-up guide](../firmware/T14-BRINGUP.md), with its recorded app hash. No broad flash erase is included.

## Limits and next gate

Actual phone reachability/save, normal flash/startup, one timer-sleep saved reconnect and normal restore are observed. Remaining physical power-cycle/BOOT/USER/failure/photo observations and acceptance/merge stay pending; compilation/mocks do not pass these criteria. Battery calibration and life await the pack and later cards. T16 owns weather download, ext0 wake integration and the half-hourly schedule. T15 stays In progress until its criteria, independent QA, Jeremy acceptance and authorized merge all pass. No T16 work is dispatched. When T16 implements ext0 wake, start BOOT sampling before serial/wake-processing waits so its held-wake threshold starts immediately; this note is also on the T16 card.

## Actual phone save — 2026-10-07 14:21 MDT

Jeremy submitted home Wi-Fi privately and reported no obvious portal success/failure feedback. Actual serial confirms `Trying submitted Wi-Fi` then `Provisioning complete; setup frame retained`; full sanitized capture is [t15-phone-provisioning.txt](../firmware/logs/t15-phone-provisioning.txt). The subsequent agent monitor attachment generated a labeled USB reset and `Saved Wi-Fi connected; panel retained`, with no setup redraw log. Physical USB power-cycle/panel observations and BOOT/timer-sleep checks remain pending; do not conflate the monitor-induced reset with a physical power cycle. Both jobs passed on evidence-only head 36a513c in CI run 37680646611; require latest-head success before merge. Frozen firmware unchanged.

## Resumed actual sleep test and normal restore — 2026-10-07

Frozen harness flashed after source/all file checks, each written-image hash verified, then actual runtime logged saved reconnect, one configured ten-second timer sleep, USB disappearance/re-attachment and `Timer wake reconnected; persistence observed`. Capture [t15-timer-persistence.txt](../firmware/logs/t15-timer-persistence.txt), [artifact/flash record](../firmware/logs/t15-timer-persistence-record.md). Independent epaper_qa audited actual capture and unchanged harness: success requires TIMER wake + RTC marker + savedReconnect; portal recovery or USB-induced reset cannot produce it. This one real sleep persistence cycle Pass; not T16 scheduling/ext0/current/battery evidence. Duration configured, not independently measured. Raw tty observer omits DTR/RTS ioctl and disables HUPCL but cannot guarantee universally reset-free host behavior.

Exact approved normal bundle restored, all four write hashes verified and `Saved Wi-Fi connected; panel retained` observed: [normal restore record](../firmware/logs/t15-normal-restore-record.md). Bounded harness removed. [Resume reconnect capture](../firmware/logs/t15-resume-reconnect.txt) was obtained after Jeremy's earlier physical-cycle/panel-retention report but includes an additional monitor-induced reset; do not claim the physical transition was recorded. BOOT/second directly captured power cycle/USER/failure/photo checks remain pending; Jeremy acceptance/merge and T16 advancement remain unauthorized. Both required jobs passed on pre-resume head34eca88 in run37681660201; new evidence-only head also requires green before merge.

## Actual normal runtime BOOT observation — 2026-10-07

Jeremy confirmed panel refresh back to Wi-Fi setup after brief BOOT press/release, two-second wait, ten-second hold/release without RESET. [Actual runtime](../firmware/logs/t15-boot-reset.txt) records one short refresh hook, one credential reset and one setup display; driver two full-update phases are one setup entry, not repeated hold resets. Phone portal re-entry still pending because AP callback line has not yet appeared. No actual credential-erasure success is inferred solely from setup image. USER, failed submission/correct retry, directly captured second physical USB cycle and setup photo remain pending. Frozen restored normal/source unchanged.
