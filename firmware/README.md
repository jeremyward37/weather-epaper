# T16 wake, fetch and sleep firmware

The production default is `nm-epd-420-bw`. A provisioned device joins Wi-Fi (20-second cap), requests a fresh NTP sync (10-second cap), downloads a raw frame over verified HTTPS (one 15-second deadline across DNS, TLS, request, headers and body), refreshes only changed pixels, and deep-sleeps. No device text/layout/PNG decoding is used. Network failures and malformed, short or oversize responses never initialize or redraw the panel. The approved setup bitmap is unchanged.

The Mountain timezone is `MST7MDT,M3.2.0,M11.1.0`. Production timer slots are local `:00`/`:30` from **05:00 through 22:00 inclusive**, 35 attempts daily. The next target is strictly future and retained in RTC memory. Timer wakes begin approximately 20 seconds before that target; after joining and syncing, the device waits until the nominal target before requesting the frame. A slow join that crosses 22:00 still attempts the retained final slot. A completed/failed target is consumed before scheduling the next one, so the early-wake lead cannot repeatedly skip or wake on the same slot. A fresh boot within the lead window sleeps until the slot itself. Targets more than two minutes late after clock correction or a long portal stay are discarded. Cold boot, new provisioning, and BOOT wake request an immediate attempt, including outside the production timer window.

NTP uses `pool.ntp.org` and `time.nist.gov`, clearing old sync status before each request. Failure uses the ESP-IDF RTC system clock only after a successful sync in this retained RTC lifetime. With no valid clock it keeps the panel and sleeps 30 minutes. Cold power loss clears RTC state; NVS credentials/frame identity survive. The pinned clock combines RTC and the high-resolution timer; drift is corrected by each successful NTP request. Actual drift remains a hardware observation.

Sixteen raw conversions and sixteen adjacent calibrated `analogReadMilliVolts` conversions are averaged after enabling ADC_EN and waiting 80 ms. Volts are `average ADC_mV × 2 / 1000`. The provisional threshold is **3.55 V**, with a **0.10 V** hysteresis band; the last voltage choice is stored in NVS. `frame-lowbat.bin` is selected below threshold, or below threshold plus the band after a low choice; otherwise `frame.bin`. **USB-only, empty battery connector, observed ADC=0 selects lowbat by this rule.** It does not establish battery presence, charge level, calibration, or current. There is no inferred pack detection or USB bypass. Final values and calibration belong to T17.

## Frame and storage contract

The production URL is `https://weather.builtbyjer.com/<file>?t=<epoch>`. An explicit `FRAME_BASE_URL` build override may select the GitHub Pages fallback `https://jeremyward37.github.io/weather-epaper/`; there is no automatic downgrade/fallback after a TLS failure. The URL must be HTTPS, port 443, a DNS hostname, an optional path prefix and a trailing slash. DNS runs asynchronously on lwIP's TCP/IP thread; completion storage survives a late callback. TLS connects to the resolved IPv4 address while the original DNS hostname supplies SNI, required certificate name validation, and the HTTP Host header. ESP-IDF's pinned full certificate bundle supplies trusted roots. No insecure mode, unchecked certificate, redirect following, or HTTP fallback exists. Network-specific certificate validation still needs Jeremy's actual device trace.

A bounded 4096-byte HTTP/1 header parser and exactly 15,000-byte framebuffer are accepted only for status 200, `Content-Type: application/octet-stream`, exact Content-Length, no transfer coding, and no content encoding except identity. EOF is required after exactly 15,000 bytes. The parser rejects duplicate length, bad numeric length, embedded controls/NUL, oversized headers and extra/truncated bodies. Every raw byte is a valid pixel pattern; raw frames have no magic number or semantic fields. `meta.json` is for server/preview verification, not an additional device fetch. SHA-256 is calculated locally and compared with `lastFrameSha` in NVS. TLS and exact framing validate the download; the server's published hashes and frame/PNG fidelity are verified separately.

A changed-frame write first checks durable removal of the old SHA and saves a checked `framePending` marker. Failure of either step retains the panel. After `writeImage`, full `refresh(false)`, and `hibernate`, the firmware commits `everShown` and the new SHA, reading back their values. The pending marker is removed only after both identities are established. An interrupted/failed commit forces a future redraw and conservatively suppresses automatic portal recovery: `framePending` means **panel state unknown**, not a confirmed successful physical refresh. This prevents an A→B→A failed-commit no-redraw bug and prevents setup overwriting a potentially displayed first weather frame. A latched reset is applied before any fetched-frame identity commit, including after display work. GPIO BUSY is observed through the driver's callback and a falling-edge reset; a near-ten-second stuck-HIGH condition or HIGH after hibernation prevents SHA commit. This detects that timeout, but successful BUSY completion alone cannot prove correct glass pixels; photos remain required.

NVS namespace `weather` contains metadata only: `provisioned`, `resetPending`, `lastFrameSha`, `everShown`, `framePending`, `lastLow`, and `joinFailures`. Credentials remain solely in native Wi-Fi NVS. Consecutive failed saved-network joins increment a durable, saturating wake counter; a successful join resets it. Before a confirmed or potentially displayed weather frame, the default twentieth failed wake reopens setup. After a frame is established/pending, outages always retain it; there is no automatic portal redraw. BOOT reset deliberately replaces the frame with setup and checks removal of all frame/history/choice/failure metadata first. Storage hardware failures are logged and may require investigation; no successful metadata commit is assumed from an unchecked call.

## BOOT, provisioning and sleep

`WeatherStation-Setup` / public password `firstlight`, captive DNS/HTTP at `192.168.4.1`, retains T15's verified submission and reset-tombstone behavior. It waits for successful provisioning without a portal timeout. Short BOOT press/release requests immediate refresh. Holding BOOT five seconds resets credentials and enters setup; USER remains unused. GPIO0 is deinitialized from RTC mode and sampled before Serial, NVS-open, ADC or network startup waits. The independent five-millisecond sampler captures holds during bounded network/library operations. Reset application can be deferred until those operations return; reset wins before committing a downloaded identity. An ext0 short release is coalesced with the wake's immediate attempt. A held reset clears that suppression so the next genuine short press works. Do not hold BOOT during power connection/reset: that selects the ROM downloader.

Before production deep sleep, BOOT must be released; a held LOW level would immediately retrigger ext0. A stuck/held button deliberately keeps the device awake and reset-responsive. Wi-Fi is disconnected without credential erase and switched OFF. The panel is hibernated only if it was initialized during this wake. ADC_EN, TEMP_CTL, PA_CTRL, CODEC_EN, LORA_EN and LORA_RST are driven/held LOW; SD/LoRa/EPD selects and EPD DC are held HIGH; EPD reset is held LOW after hibernation. Per-pin holds plus deep-sleep hold preserve levels. Holds are released before the next ADC/display use. Both timer and GPIO0 LOW ext0 wake are enabled. There is no USER wake, LoRa activity or battery current claim.

## Build and software checks

Use PlatformIO Core **6.1.18** and `esp-idf-size` **1.6.1** from `build-requirements.txt`. The platform remains vendor-pinned pioarduino **54.03.21**, Arduino **3.2.1** / ESP-IDF **5.4.2**, GxEPD2 **1.6.8**, GFX **1.12.1**, BusIO **1.17.4**, WiFiManager **2.0.17**. No vendor library is patched.

```sh
cd ~/codeProjects/weather-epaper
python3 -m venv /private/tmp/weather-epaper-t16-venv
/private/tmp/weather-epaper-t16-venv/bin/python -m pip install -r firmware/build-requirements.txt
export PATH="/private/tmp/weather-epaper-t16-venv/bin:$PATH"
export PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t16-pio
sh firmware/test/run-native.sh
pio test -d firmware -e native
pio run -d firmware -e nm-epd-420-bw -e wake-debug -e provisioning-persistence-test
```

Native tests execute the deployed provisioning controller, scheduling functions, HTTP parser, main orchestration and net module with controlled hardware/storage/TLS adapters. They cover window endpoints/all 35 slots, spring/fall DST/overnight/year rollover, retained early/final targets, short/oversize/malformed responses, fixed DNS/TLS/write/read/drip deadlines, verification configuration/error rejection, fresh NTP versus RTC fallback, first-frame failed-join counting, unchanged/failure no-init, A/B/A commit failure, pending first-frame metadata failure, reset priority, BOOT suppression and sleep outputs. Fakes are deterministic software evidence, not physical TLS/radio/current measurements. CI runs both native paths and all three firmware builds, and uploads four-image bundles with source revision and hashes.

`src/config.h` is the configuration authority. Default `DEBUG_INTERVAL_S=0` is production. The separate **wake-debug** environment defines `DEBUG_INTERVAL_S=120`: it sleeps toward a target 120 seconds after sleep planning, with the same early join/wait behavior. It overrides the local production window solely for quick observations; it must be replaced with the production artifact after testing. Other nonzero values must be 60–1800 seconds. `FAILED_JOIN_PORTAL_WAKES` defaults to 20. `LOG_LEVEL` defaults to 1 for generic T16 step/ms/outcome lines; zero suppresses these lines (T15's generic provisioning messages and a driver timeout remain available). `WM_NODEBUG`, runtime manager debug-off and `CORE_DEBUG_LEVEL=0` suppress network identifiers/passwords; do not enable verbose upstream network logs.

## Needs Jeremy

No software build or test is hardware release approval. Use the orchestrator's reviewed **frozen artifact directory, source revision and SHA256SUMS**; normal and debug binaries differ. Do not substitute a later local rebuild. The original physical criterion requires correct production wake times across **at least one hour**, changed and unchanged frames, Wi-Fi failure retention, and measured deep-sleep current or a documented measurement limitation. Two quick debug cycles do not close the one-hour production criterion.

1. After explicit release/flash approval, close monitors and identify the application port with `pio device list`. Keep the empty battery connector/USB-only condition recorded. Enter the ROM downloader by holding BOOT during USB reconnect, then release it and rediscover the port.
2. Verify all frozen hashes with `shasum -a 256 -c SHA256SUMS` inside the selected bundle. The reviewed packet supplies the exact bundle path and port. With `T16_BUNDLE` and `T16_PORT` set to those values, the explicit-offset command is:

```sh
python "$PLATFORMIO_CORE_DIR/packages/tool-esptoolpy/esptool.py" \
  --chip esp32s3 --port "$T16_PORT" --baud 460800 \
  --before default_reset --after hard_reset write_flash \
  --flash_mode dio --flash_freq 80m --flash_size 16MB \
  0x0000 "$T16_BUNDLE/bootloader.bin" \
  0x8000 "$T16_BUNDLE/partitions.bin" \
  0xe000 "$T16_BUNDLE/boot_app0.bin" \
  0x10000 "$T16_BUNDLE/firmware.bin"
```

Do not use `pio run -t nobuild -t upload`: the pinned vendor platform can lose the required offsets. Reconnect USB with BOOT released if the application does not start. Rediscover its CDC port and monitor:

```sh
pio device monitor -d firmware -e nm-epd-420-bw --port "$T16_PORT" --baud 115200
```

3. Record sanitized step outcomes and the review revision/hash. Saved credentials should reconnect without setup. NTP should report `synced`, fetch `accepted-15000-lowbat` under the observed no-pack zero-voltage rule, and changed display `changed-refreshed-hibernated-sha-saved`. Compare a whole-panel photo with the **low-battery** preview at `https://weather.builtbyjer.com/`; its footer may already be old because the server retains the previous successful bundle. Software cannot manufacture fresh weather during a publisher outage.
4. With BOOT released, capture sleep `target_epoch` and subsequent timer attempts. USB CDC may disappear across deep sleep: rediscover/reopen monitor as needed. A debug build allows quick repetition but the production build must then be observed across at least an hour (three consecutive half-hour targets). Verify local target times, early join, fetch at/after target, and no 22:30/overnight timer slot.
5. Repeat while the hosted frame is unchanged: expect `identical-no-redraw` and no flicker. On an actually changed hosted frame expect one full image refresh; compare the entire panel with its matching preview and retain the photo/serial evidence. Do not change hosting or approved exports just to produce test data.
6. Temporarily make saved Wi-Fi unavailable, allow a scheduled wake, and restore it. After a weather frame, expect bounded failed join, no setup/hotspot/redraw, unchanged panel and another scheduled sleep. Confirm the subsequent successful reconnect/fetch. Record NTP/hosting failure outcomes if available; avoid capturing credentials.
7. From deep sleep, a brief BOOT press requests immediate refresh. Hold BOOT five seconds after waking, allow bounded work to finish, then release: expect reset/setup, reconfigure privately, and verify a later short press still requests refresh. USER must do nothing. Record any `Busy Timeout!`, `panel-timeout`, reset loop, or malformed/fetch failures; stop release acceptance on them.
8. Measure deep-sleep current using an appropriate supply/meter setup if available. If it cannot be measured, record the exact limitation and power arrangement. The board currently has no pack and runs from continuous USB; USB draw is not battery-loop current. This feeds T17/T19 without inventing measurements.

Rollback: flash the previously accepted frozen **T15 normal** four-image bundle with the same explicit offsets and its verified hashes, then reconnect with BOOT released. This preserves native NVS unless you explicitly erase it. A deliberate BOOT reset requires re-entering Wi-Fi. T15 remains awake and does not fetch scheduled weather, so its behavior is the known rollback baseline.

## Separate bounded persistence harness

`provisioning-persistence-test` deliberately bypasses T16 weather fetch/scheduling. After connection it waits 30 seconds with BOOT released, sleeps once for ten seconds, then reconnects from native NVS and prints `Timer wake reconnected; persistence observed`. An RTC marker prevents repeating that test until cold power loss. This retained T15 diagnostic is a different reviewed artifact; its software build does not re-establish physical persistence evidence for T16. Its sleep is a test interval, not a battery-current acceptance measurement.
