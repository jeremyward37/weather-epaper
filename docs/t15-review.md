# T15 review packet — Wi-Fi provisioning

Task: [T15](https://app.notion.com/p/3e7d9adbacad812f82cedeb47e813b0b). Branch: `codex/t15-wifi-provisioning`, based on accepted/merged T14 `08be1ac`. [PR #20](https://github.com/jeremyward37/weather-epaper/pull/20). Final firmware/config/test/workflow source: `b8ae0c4c1680d6fd3857b6d413248e298599d8ee`; frozen hashes are below. Status **Done; Jeremy accepted T15 and authorized merge/start T16 on 2026-10-07. PR #20 merged as `637c2751c740f1a6dfe939a45acece1f09e5b74f`; both required CI jobs passed on accepted head `6e0c57f36abd041468066961de6ed02d627867b6` in run37693025721.** Original criteria and independent QA Pass; exact approved normal remains installed/provisioned. Later test/reference records are historical. T16 has separate release/hardware/acceptance gates.

## Behavior

The approved setup bitmap is drawn on provisioning entry after the previous frame hash is confirmed cleared. A metadata failure retries with BOOT handling active before any redraw. A password-protected `WeatherStation-Setup` hotspot serves the Wi-Fi-only captive portal at `192.168.4.1`; the public setup password is `firstlight`. Saved credentials reconnect on the next boot without a panel redraw. Setup remains visible until T16 downloads a frame. Runtime BOOT short release invokes a logged T16 refresh hook; a five-second hold clears credentials and returns to setup. USER is unused. Holding BOOT during physical reset enters the ROM downloader instead.

Credentials remain in native Wi-Fi NVS. Preferences stores provisioning/frame metadata and reset intent; home identifiers/passwords are not logged. The approved frames, server, fetch behavior and refresh schedule are unchanged. The normal firmware stays awake on USB. A separate bounded persistence harness enters one ten-second timer sleep after a thirty-second grace period, then verifies saved reconnect without entering setup; it is a distinct artifact, not the T16 schedule.

## Acceptance and QA

| Criterion | Evidence | Result |
|---|---|---|
| Pinned WiFiManager and required API/hotspot/portal | Source review/build plus Jeremy phone submission and actual Provisioning complete serial line in t15-phone-provisioning.txt | Pass |
| BOOT reset and short refresh hook, USER unused | Production-controller tests and t15-boot-reset.txt plus Jeremy panel report: one short hook, one reset/setup after ten-second hold; AP/phone re-entry/correct re-provision observed in t15-reset-reprovision.txt; Jeremy confirms USER has no visible effect | Pass for observed runtime checks |
| Setup only on provisioning entry; frame identity slot | Source/native checks; setup header must remain byte-identical | Software Pass |
| Credentials survive power cycle and deep sleep | Actual harness TIMER-wake saved reconnect, independent audit Pass; second physical USB transition/saved reconnect captured in t15-reset-reprovision.txt, Jeremy confirms unchanged panel | Pass for observed cycles |
| No credentials printed or committed | Source/upstream logging audit and sanitized actual startup/phone serial | Pass for observed runs |
| Original four Jeremy checks with serial excerpts | Normal/harness/restore verified, phone save/re-provision, physical power-cycle saved reconnect and long BOOT reset/portal return observed | Pass; independent original-criteria audit complete |
| Independent QA and final-head CI | Separate GPT-6.1 Sol · High audit: 10 deployed native scenarios, 14 independent timer/NVS failure scenarios, clean normal/harness builds, header regeneration/zero-pixel framediff, secret-log audit and offline upload checks. Source CI passed; final PR-head CI tracked on GitHub/Notion before release/merge | Pass; both required jobs on accepted head6e0c57f |
| Jeremy acceptance and authorized merge | Jeremy explicit acceptance/merge/T16-start; exact-head guarded merge637c275 after green CI | Pass |

## Needs Jeremy

None for accepted T15. Jeremy accepted this packet, including its recorded limitations, and authorized PR #20 merge/T16 start. All original criteria/QA and accepted-head CI passed; merge637c275 is confirmed. Leave the installed normal provisioned while T16 software is prepared. No T16 flash/release/merge approval follows from the start instruction.

Jeremy explicitly approved **T15 normal firmware flash and the separate persistence test** for reviewed PR head `250ec59` and both exact frozen hashes below; both required CI jobs passed in run 37677877843. His subsequent request that the agent run Terminal commands overrides AGENTS.md rule 13's manual Terminal handoff for these approved operations. The agent completed the normal upload with automatic BOOT entry (`--before default-reset`), exit 0 and all written-image hashes verified. Startup confirmed the setup frame and AP IP 192.168.4.1; see [flash record](../firmware/logs/t15-normal-flash-record.md) and [startup capture](../firmware/logs/t15-first-startup.txt). The agent handles upload/monitor/harness/normal restore; Jeremy handles private phone credentials, buttons, physical power cycles and photos. No repeat approval is needed.

The steps and commands below remain a manual fallback reference; normal flashing is already complete.

Completed test/reference sequence (recommended additional physical failure cases remain unrun as recorded):

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

Latest resumed enumeration: `/dev/cu.usbmodem114101`, USB JTAG/serial debug unit, VID:PID303A:1001, serial28:84:85:9F:0E:FC. Rediscover after ROM/reset/sleep; replace the port in commands if it changes. The following commands are the approved upload reference; the agent may execute them under the recorded Terminal override. Automatic entry uses `--before default-reset`; the shown `no-reset` variant requires manual ROM entry. They validate all five image/ELF hashes and the source revision before any write. They leave NVS untouched; do not add an erase-flash step.

Normal flash, also used to restore normal firmware after the harness:

```sh
(
  cd /private/tmp/weather-epaper-t15-artifacts/b8ae0c4c1680d6fd3857b6d413248e298599d8ee/nm-epd-420-bw &&
  test "$(cat SOURCE_REVISION)" = b8ae0c4c1680d6fd3857b6d413248e298599d8ee &&
  shasum -a 256 -c SHA256SUMS &&
  /private/tmp/weather-epaper-t14-venv/bin/python \
    /private/tmp/weather-epaper-t14-pio/packages/tool-esptoolpy/esptool.py \
    --chip esp32s3 --port /dev/cu.usbmodem114101 --baud 115200 \
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
    --chip esp32s3 --port /dev/cu.usbmodem114101 --baud 115200 \
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
-e nm-epd-420-bw --port /dev/cu.usbmodem114101 --baud 115200
```

Offline QA validated esptool argument parsing while denying serial access, merged-image address ranges, partition fit and bootloader/app headers. That offline QA involved no device access. The subsequent approved normal upload and startup capture are recorded above. On missing AP, credential leakage, boot loops, wrong panel content or Busy Timeout, stop and return sanitized evidence. Existing accepted T14 snapshot remains unchanged at `/private/tmp/weather-epaper-t14-artifacts/4ac387dbbbb3672b11672222f360a83804c8d615/`; recovery is the exact accepted T14 command in [T14 packet](t14-review.md) / [historical bring-up guide](../firmware/T14-BRINGUP.md), with its recorded app hash. No broad flash erase is included.

## Limits and next gate

All original T15 functional criteria and independent hardware QA pass: actual phone save, physical USB-cycle saved reconnect, one timer-sleep saved reconnect, runtime BOOT clear/re-provision, USER inactivity and normal restore are observed. Recommended wrong-submission and unavailable-network cases remain physically unrun, with software coverage. The supplied photo is the accepted T14 reference reused byte-for-byte; current T15 panel reports and unchanged setup frame bytes are separately recorded. Final evidence-head CI, Jeremy acceptance and authorized merge remain pending. Battery calibration and life await the pack and later cards. T16 owns weather download, ext0 wake integration and the half-hourly schedule. T15 stays In progress until its criteria, independent QA, Jeremy acceptance and authorized merge all pass. No T16 work is dispatched. When T16 implements ext0 wake, start BOOT sampling before serial/wake-processing waits so its held-wake threshold starts immediately; this note is also on the T16 card.

## Actual phone save — 2026-10-07 14:21 MDT

Jeremy submitted home Wi-Fi privately and reported no obvious portal success/failure feedback. Actual serial confirms `Trying submitted Wi-Fi` then `Provisioning complete; setup frame retained`; full sanitized capture is [t15-phone-provisioning.txt](../firmware/logs/t15-phone-provisioning.txt). The subsequent agent monitor attachment generated a labeled USB reset and `Saved Wi-Fi connected; panel retained`, with no setup redraw log. Physical USB power-cycle/panel observations and BOOT/timer-sleep checks remain pending; do not conflate the monitor-induced reset with a physical power cycle. Both jobs passed on evidence-only head 36a513c in CI run 37680646611; require latest-head success before merge. Frozen firmware unchanged.

## Resumed actual sleep test and normal restore — 2026-10-07

Frozen harness flashed after source/all file checks, each written-image hash verified, then actual runtime logged saved reconnect, one configured ten-second timer sleep, USB disappearance/re-attachment and `Timer wake reconnected; persistence observed`. Capture [t15-timer-persistence.txt](../firmware/logs/t15-timer-persistence.txt), [artifact/flash record](../firmware/logs/t15-timer-persistence-record.md). Independent epaper_qa audited actual capture and unchanged harness: success requires TIMER wake + RTC marker + savedReconnect; portal recovery or USB-induced reset cannot produce it. This one real sleep persistence cycle Pass; not T16 scheduling/ext0/current/battery evidence. Duration configured, not independently measured. Raw tty observer omits DTR/RTS ioctl and disables HUPCL but cannot guarantee universally reset-free host behavior.

Exact approved normal bundle restored, all four write hashes verified and `Saved Wi-Fi connected; panel retained` observed: [normal restore record](../firmware/logs/t15-normal-restore-record.md). Bounded harness removed. [Resume reconnect capture](../firmware/logs/t15-resume-reconnect.txt) was obtained after Jeremy's earlier physical-cycle/panel-retention report but includes an additional monitor-induced reset; do not claim the physical transition was recorded. BOOT/second directly captured power cycle/USER/failure/photo checks remain pending; Jeremy acceptance/merge and T16 advancement remain unauthorized. Both required jobs passed on pre-resume head34eca88 in run37681660201; new evidence-only head also requires green before merge.

## Actual normal runtime BOOT observation — 2026-10-07

Jeremy confirmed panel refresh back to Wi-Fi setup after brief BOOT press/release, two-second wait, ten-second hold/release without RESET. [Actual runtime](../firmware/logs/t15-boot-reset.txt) records one short refresh hook, one credential reset and one setup display; driver two full-update phases are one setup entry, not repeated hold resets. Phone portal re-entry still pending because AP callback line has not yet appeared. No actual credential-erasure success is inferred solely from setup image. USER, failed submission/correct retry, directly captured second physical USB cycle and setup photo remain pending. Frozen restored normal/source unchanged.

## Actual portal return and correct re-provision — 2026-10-07

Jeremy rejoined the setup portal and submitted correct home settings again. [Full restored-normal sequence](../firmware/logs/t15-reset-reprovision.txt) now includes AP IP192.168.4.1, new submission and Provisioning complete after the short/long BOOT reset. Portal return and correct re-provision Pass. Failed-submission/corrected-retry was skipped by this submission, so remains physically unobserved; saved-network-unavailable physical case also unobserved, software tests Pass for both. Working credentials retained; no extra reset performed just to repeat setup. USER, directly captured second physical cycle and fresh photo remain pending, followed by acceptance/authorized merge.

Post-reprovision observer also captured USB disconnect, same-board raw reattach and saved reconnect without setup redraw/AP in t15-reset-reprovision.txt. Normal firmware has no ESP sleep; this is a new USB transition while Jeremy's physical cycle/panel/USER report is pending. Do not mark USER/panel observation Pass from serial absence alone.

Jeremy subsequently confirmed requested brief USER plus five-second USB unplug/replug and twenty-second wait, with the screen unchanged through both. Actual capture already showed USB disconnect/reattach and saved reconnect without redraw/AP; USER inactivity and this second physical cycle Pass. Fresh whole-panel photo requested; independent final hardware reconciliation is pending, with failed-submission/saved-network-unavailable physical cases still explicitly unobserved (software tests Pass). Acceptance/merge and T16 advancement remain unauthorized.

## Final original-criteria gate and photo provenance — 2026-10-07

Independent hardware reconciliation [t15-hardware-qa.md](t15-hardware-qa.md) passes all original T15 functional criteria. Wrong-submission/retry and saved-network-unavailable remain physically unobserved recommendations with passing software coverage; no extra physical failure result is claimed. Supplied IMG_2842.JPG is byte-identical to accepted [T14 setup photo](../firmware/photos/t14-setup.jpg), reused visual reference rather than a fresh T15 exposure. Jeremy's actual T15 redraw/retention reports and unchanged exact setup bytes are separate evidence. Original card has no fresh-photo requirement. Normal installed/provisioned; raw monitor stopped. Final evidence-head CI and explicit acceptance/authorized merge remain required; no T16 authorization.

## Acceptance and merge — 2026-10-07 16:07 MDT

Jeremy explicitly accepted T15 and authorized PR #20 merge and T16 start after confirming weather is not expected until T16. Both required CI jobs passed on accepted head6e0c57f in run37693025721; exact-head-guarded squash merged637c275 at16:07:53 MDT. T15 Done. Earlier pending gate statements in dated evidence/reference sections describe their session stage; the current status above supersedes them. Recommended physical failure coverage remains unrun and honestly disclosed. No further T15 hardware action needed.
