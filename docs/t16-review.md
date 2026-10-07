# T16 review packet — scheduled weather fetch and sleep

[T16 card](https://app.notion.com/p/3e7d9adbacad8159a797d88686a8ee03) · [PR #21](https://github.com/jeremyward37/weather-epaper/pull/21) · branch `codex/t16-wake-fetch-sleep`, base merged T15 `637c275`.

Software/artifact source: **`068113577d1739da8b7ac13cfc77dec5d3b7d7c6`**. Status **In progress; independent software QA passed; awaiting Jeremy’s T16 flash/test approval**. Documentation-only review commits do not replace the frozen source/artifacts. T15 remains installed/provisioned; no T16 upload, device access, hosting change or T17 work during this preparation.

## Delivered behavior

Saved Wi-Fi reconnects with a 20-second cap; a fresh NTP sync has ten seconds and falls back to a previously set RTC. The device downloads exactly 15,000 bytes over certificate- and hostname-verified HTTPS, with one 15-second deadline across DNS, TLS, request and response. Bad status/framing, short/extra data or failures preserve the panel. Identical SHA skips display initialization and refresh. Changed frames use the approved full-write/refresh/hibernate path; checked pre-draw identity invalidation and a durable pending marker protect interrupted storage commits. The first changed image can have a white-clear phase followed by the image update; it is one logical image transition, not a promise of one electrical refresh phase. Identical-frame wakes must have no display refresh.

Production targets Mountain `:00`/`:30`, **05:00 through 22:00 inclusive**, joining about 20 seconds early and waiting for the target before fetching. BOOT wakes immediately; a held five-second reset retains T15 provisioning behavior. USER remains unused. Wi-Fi is off and peripheral outputs are held at the vendor sleep levels before timer/ext0 deep sleep. [Firmware README](../firmware/README.md) describes configuration and limits; [hardware record](../firmware/HARDWARE.md) names pinned APIs and power assumptions.

Battery thresholds **3.55 V / 0.10 V** are provisional until T17. Empty-pack USB ADC zero selects the approved low-battery weather variant, including its footer glyph; it does not identify charge or pack presence. No approved frame or rendering rule changed. The setup screen remains expected on installed T15 until T16 is approved and flashed.

## Verification and remaining criteria

| Criterion | Evidence | Result |
|---|---|---|
| Native schedule and failure checks | 25 deployed provisioning/main/net and schedule/parser scenario/suite invocations; PlatformIO native Unity testcase | Pass; independent deployed-code checks also pass |
| Clean production/debug/persistence builds | Pinned Core6.1.18/pioarduino54.03.21/Arduino3.2.1; three clean SUCCESS builds | Pass |
| Independent software QA | Separate GPT-6.1 Sol · High exact-source audit: [QA report](t16-qa.md), 32 additional deployed-code cases, clean three builds and offline bundle/packet checks | Software Pass; physical criteria Pending |
| Required CI on review head | Both source-head jobs SUCCESS in [run37696744465](https://github.com/jeremyward37/weather-epaper/actions/runs/37696744465); final documentation-head readback recorded on GitHub/Notion before the review pause | Source Pass; final head must be green before release/merge |
| Approved bytes and published preview | No canonical/setup changes; host HTTPS200, both15000-byte bins, published hashes match; both raw/PNG zero-pixel comparisons | Host/software Pass; device TLS/panel Pending |
| Correct real wakes across **at least one hour** | Actual production timer traces/host timestamps and Jeremy observations required | Pending |
| Frame matches index; changed/unchanged/offline panel behavior | Actual flashed hash, sanitized trace and whole-panel observations/photo required | Pending |
| Deep-sleep current or documented reason measurement unavailable | Actual measurement arrangement or Jeremy's stated limitation | Pending; USB power alone is not battery-loop current |
| Jeremy acceptance/authorized merge | Separate later gate after physical evidence and exact-head green CI | Pending |

[Live endpoint report](t16-live-endpoint.md) records the 16:11 MDT host observation: valid bytes and trust, but published footer11:49 AM. The existing T21 publisher punctuality issue remains a separate card; T16 cannot promise fresh data when static hosting has not published it. No stale badge or hosting change was introduced.

## Frozen build artifacts

Root: `/private/tmp/weather-epaper-t16-artifacts/068113577d1739da8b7ac13cfc77dec5d3b7d7c6/`. Every environment directory contains read-only `firmware.bin`, `bootloader.bin`, `partitions.bin`, `boot_app0.bin`, `firmware.elf`, `SOURCE_REVISION`, `BUILD_VERSION`, `SHA256SUMS`. Root independently copied and hashed the clean local builds. A later rebuild is a different artifact; Linux CI hashes may differ.

| Environment | App bytes | App SHA-256 | Proposed hardware use |
|---|---:|---|---|
| `nm-epd-420-bw` | 1,320,544 | `17122de56f655b7b37bcc3464f310416ec8b48e189730157e95b9b9a0bc29957` | Production flash and one-hour test |
| `wake-debug` | 1,320,528 | `831e1ebe292c0faec4a0d10d55a5a2a8f052ec2c928fdb3618a5b26d375af893` | Optional separately approved120s diagnostics; cannot replace production hour |
| `provisioning-persistence-test` | 1,156,688 | `b5f4472fb0476316bbd83a800f3a8908bf9e1337b2a31729f875a5f684923268` | Built regression harness; not proposed for this release |

Production/debug RAM64,804 bytes; production app-flash1,320,026/debug1,320,010 of3,145,728. Persistence RAM64,044/app-flash1,156,186. Flash DIO80m/16MB, CPU80MHz, OPI PSRAM8MB. Independent offline CLI/offset/partition/image checks pass, including exact frozen hashes, image segment/source comparison and packet parsing. No device access is part of those checks.

## Needs Jeremy

**Decision requested:** approve this frozen **production T16 flash and one-hour physical test**. This approval will not merge PR21, accept the physical criteria, release the debug/harness variants or start T17.

The enduring request that the agent run Terminal commands overrides the manual Terminal handoff in AGENTS.md rule13. **The agent runs upload, hash verification, port discovery and serial capture.** Jeremy handles physical buttons/power, private credentials, panel observations/photos and measurement limitations. Keep the battery connector empty and USB connected during software review. No Terminal command needs to be typed by Jeremy.

Once approved:

1. Agent verifies source/all five hashes, discovers the same board and uploads production without erasing NVS. Automatic BOOT entry uses `--before default-reset`. If physical entry is needed: keep USB connected, hold **BOOT**, press/release **RESET**, wait two seconds, release BOOT; agent rediscovers the port. Old e-paper pixels can persist in downloader mode. If needed after upload, press/release RESET with BOOT released.
2. Expect saved Wi-Fi reconnect, fresh NTP or valid RTC, `accepted-15000-lowbat` for the observed USB ADC0, one full weather refresh and sleep. Private credentials should remain saved. If a portal is required, Jeremy uses the setup network/phone privately. Photograph the whole weather panel and compare it with the matching low-battery preview in [published index](https://weather.builtbyjer.com/); the footer timestamp can be old if publishing is late.
3. Agent collects actual timer reasons/target epochs and wall-clock times across **at least one hour**, covering consecutive production slots. USB CDC may disappear in sleep; agent rediscovers it. Jeremy confirms unchanged frames do not flicker and changed frames refresh. Two quick debug cycles are insufficient. A first setup→weather refresh establishes a changed transition; an unchanged wake requires both `identical-no-redraw` and Jeremy's panel observation.
4. After weather is displayed, Jeremy temporarily makes the saved Wi-Fi unavailable for a scheduled wake, then restores it. Expect failed join within20 seconds, no setup/hotspot/refresh, same panel and scheduled sleep; confirm recovery. Agent records sanitized logs. Coordinate timing before disrupting home Wi-Fi; do not erase credentials or change hosting just to simulate failure.
5. Confirm brief BOOT from sleep causes an immediate attempt and USER has no effect. A five-second BOOT hold deliberately resets to setup; bounded operations may finish first. Jeremy re-provisions privately and confirms the next genuine short press still works. Agent captures evidence. These checks are included in the proposed test scope; no repeat permission during the authorized test is needed.
6. Provide a measured sleep current with the actual supply/meter arrangement, or state why it cannot be measured. Record continuous USB/no pack explicitly. Do not interpret USB draw or ADC0 as battery-loop current. No battery-life or final threshold claim follows.

On Busy Timeout, panel-timeout, wrong/cropped/inverted frame, repeated reset, unexpected setup/secret log, or unverified TLS/fetch, stop acceptance and investigate with the actual trace. Hardware observations stay Pending until collected and independently reconciled.

## Exact agent upload reference and rollback

The port below is the last observed application port, **not a promise of current enumeration**. Agent rediscovers it before execution. The automatic-reset command verifies exact source and all frozen hashes before writing four explicit address/file pairs; it preserves native Wi-Fi NVS. The manual ROM variant changes only `--before default-reset` to `--before no-reset` after Jeremy's button sequence. Do not add erase-flash or use the defective vendor nobuild uploader.

```sh
(
  cd /private/tmp/weather-epaper-t16-artifacts/068113577d1739da8b7ac13cfc77dec5d3b7d7c6/nm-epd-420-bw &&
  test "$(cat SOURCE_REVISION)" = 068113577d1739da8b7ac13cfc77dec5d3b7d7c6 &&
  shasum -a 256 -c SHA256SUMS &&
  /private/tmp/weather-epaper-t14-venv/bin/python \
    /private/tmp/weather-epaper-t14-pio/packages/tool-esptoolpy/esptool.py \
    --chip esp32s3 --port /dev/cu.usbmodem114101 --baud 115200 \
    --before default-reset --after hard-reset \
    write-flash -z --flash-mode dio --flash-freq 80m --flash-size 16MB \
    0x0000 bootloader.bin 0x8000 partitions.bin \
    0xe000 boot_app0.bin 0x10000 firmware.bin
)
```

For rollback, agent verifies/restores the accepted T15 normal bundle at `/private/tmp/weather-epaper-t15-artifacts/b8ae0c4c1680d6fd3857b6d413248e298599d8ee/nm-epd-420-bw/`, app SHA`736c18b0ae031f60d32c1980192d0bc36a9de83fa0afa4f646ba0494a3556b3a`, with the same four offsets/settings. Exact source/all hashes and command are preserved in [accepted T15 packet](t15-review.md). No broad erase is included. T15 stays awake and does not fetch weather; the current panel may remain until deliberate reset/setup. Private Wi-Fi re-entry is needed only after a deliberate credential clear.
