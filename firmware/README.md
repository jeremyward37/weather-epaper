# T15 Wi-Fi provisioning

The normal firmware draws the existing approved setup bitmap only when entering provisioning. It starts `WeatherStation-Setup` with the public setup password `firstlight`, captive DNS and HTTP at `192.168.4.1`, and waits without a portal timeout. The setup image remains after connection; T16 supplies fetch and scheduled sleep. A boot with saved credentials reconnects within 20 seconds without initializing/redrawing the display. Failed reconnect enters setup while retaining native credentials.

BOOT (GPIO0) is the runtime button. Release after a short, debounced press requests the immediate-refresh hook (logged only until T16). Hold at least five seconds to reset credentials and enter setup. USER (GPIO45) is unused. A button already held at the first sample is timed, so T16 can call the same controller after ext0 wake. Keep BOOT released during reset/power connection; holding it then invokes the ROM downloader instead of running this firmware.

Wi-Fi credentials live only in native Wi-Fi NVS, never in Preferences, source, or logs. Preferences namespace `weather` holds `provisioned`, `lastFrameSha` (empty until T16 accepts a frame), and a reset-intent tombstone `resetPending`. Native config is authoritative to recover a save interrupted before the flag commit. The tombstone blocks reconnecting old credentials after interrupted/failed erase; successful replacement provisioning clears it. Entering setup checks that the previous frame identity was removed before drawing. A failed removal retries with live button sampling and no setup redraw or provisioning completion, so T16 cannot receive a stale hash for the replaced panel image. Flash-storage or NVS hardware failure still requires physical investigation; software tests simulate selected failures only.

`provisioning.h` exposes `hasCredentials()`, `runPortalBlocking()`, `clearCredentials()`, plus initialization, bounded reconnect and polling hooks. The external portal call blocks until connected and metadata saved. Internally it repeatedly processes WiFiManager and samples BOOT. The pinned library still has a default two-second captive-response delay and a wait even with `setSaveConnect(false)`; `setSaveConnectTimeout(1)` bounds that wait. An independent five-millisecond ESP timer samples BOOT and latches events during these waits, so a five-second hold cannot be lost when released during a form submission. The main thread applies a latched reset after the library returns, potentially roughly three seconds late. The following connection attempt runs asynchronously for up to 20 seconds, with continued button polling. A held reset fires once until release.

## Install and verify

Use PlatformIO Core **6.1.18** and `esp-idf-size` **1.6.1**, pinned in `build-requirements.txt`:

```sh
cd ~/codeProjects/weather-epaper
python3 -m venv /private/tmp/weather-epaper-t15-venv
/private/tmp/weather-epaper-t15-venv/bin/python -m pip install -r firmware/build-requirements.txt
export PATH="/private/tmp/weather-epaper-t15-venv/bin:$PATH"
export PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t15-pio
pio run -d firmware -e nm-epd-420-bw
sh firmware/test/run-native.sh
```

The platform is vendor-pinned pioarduino **54.03.21**, Arduino **3.2.1**, GxEPD2 **1.6.8**, GFX **1.12.1**, BusIO **1.17.4**, and tzapu/WiFiManager **2.0.17**. No vendor source is changed. `WM_NODEBUG`, runtime debug-off, and `CORE_DEBUG_LEVEL=0` suppress home-network identifiers and passwords, including upstream diagnostic output. Each nonempty submitted SSID and password is privately compared with native config before connection; the library callback alone cannot prove a save. Temporary comparison buffers are cleared and blank-SSID submissions are rejected. Only generic state/failure messages and the public AP IP are logged. Do not enable verbose network logging or save screenshots of credential forms.

Portable tests compile the deployed provisioning module against fake hardware/storage adapters, and exercise bounce, exact hold threshold, rollover, single reset per hold, held-wake reset, saved reconnect and frame retention, bounded failure, reset with SDK erase failure, indefinite portal waiting, bad submission/retry, portal reset/restart, and metadata failure. They do not prove radio behavior or physical NVS persistence.

## Needs Jeremy

Use only the exact reviewed artifact/revision and explicit-offset upload command supplied in the T15 review packet. The normal app is `firmware/.pio/build/nm-epd-420-bw/firmware.bin`. The separate harness app below is different: never substitute it without its own reviewed hash. Source and binary identity must be recorded for every flash. Agents do not operate ports or flash hardware.

1. With BOOT released, connect USB and identify the application port with `pio device list`. Keep the battery connector empty for this USB test. Close any serial monitor before upload.
2. Enter ROM download mode by holding BOOT during USB reconnect, release it after enumeration, and rediscover the port. Upload the reviewed frozen bundle using explicit pairs `0x0000 bootloader.bin`, `0x8000 partitions.bin`, `0xe000 boot_app0.bin`, and `0x10000 firmware.bin`, DIO/80m/16MB. **Do not use `pio run -t nobuild -t upload`**: this vendor platform skips framework setup and loses offsets. The orchestrator provides the exact hash-checking esptool command for the new T15 bundle.
3. Reconnect USB with BOOT released if the app does not start, rediscover its CDC port, then `pio device monitor -d firmware -e nm-epd-420-bw --port /dev/cu.usbmodemPORT --baud 115200`.
4. Confirm the approved setup image is upright/unshifted black on white. Join `WeatherStation-Setup` / `firstlight`, open `http://192.168.4.1`, and submit home Wi-Fi credentials privately. Serial must show public AP IP `192.168.4.1`, generic submitted/complete messages and no home SSID/password. After success the hotspot closes; setup remains on the panel until T16 delivers a frame.
5. Disconnect/reconnect USB with BOOT released. Expect `Saved Wi-Fi connected; panel retained`, no `Setup frame displayed`, and no panel refresh. Repeat power cycle. Record the actual behavior without copying home identifiers.
6. With firmware running, briefly press/release BOOT. Expect one immediate-refresh-request message and no portal. Hold BOOT at least five seconds (allow up to three additional seconds for confirmation during a concurrent form save), then release. Expect credential reset, one setup redraw and the same hotspot. A continued hold must not repeatedly reset/redraw. Reconfigure, power cycle, and confirm replacement credentials reconnect. USER must do nothing.
7. Test a wrong Wi-Fi submission: portal remains open after its 20-second connection attempt and accepts a corrected submission. Separately make saved Wi-Fi temporarily unavailable and power cycle: bounded reconnect fails, setup opens. Restore Wi-Fi and explicitly resubmit; confirm success. Record sanitized outcomes, whole-panel photo when entering setup, flash hash/revision, and any resets or `Busy Timeout!`.

## Bounded deep-sleep persistence harness

This is a separate physical test build, not T16 schedule integration:

```sh
cd ~/codeProjects/weather-epaper
pio run -d firmware -e provisioning-persistence-test
shasum -a 256 firmware/.pio/build/provisioning-persistence-test/firmware.bin
```

Have the orchestrator freeze/review this environment's four-image bundle before flashing it with the same explicit offsets. Once provisioned/connected, it waits 30 seconds with BOOT released, enters **one** ten-second timer deep sleep, then boots and reconnects through the same native-NVS provisioning path. `RTC_DATA_ATTR` prevents repeating sleep after that wake. CDC may disappear; rediscover and reopen the port. Expect `Timer wake reconnected; persistence observed`, no setup redraw/hotspot. Power cycling clears the RTC marker, so each power cycle runs another single sleep after connection. Record the wake line and retained panel, then restore the reviewed normal T15 bundle; confirm normal reconnect and BOOT behavior. It configures no ext0 wake and implements no weather fetch or refresh schedule.

Both credential power-cycle and real deep-sleep persistence are **pending until Jeremy performs these tests**. A compile or mock cannot close them.

## Recovery / historical evidence

For a missing port, use a known USB data cable and ROM entry above. After ROM flashing, normal USB reconnect with BOOT released exits downloader mode. Stop on boot loops, panel timeout, wrong polarity/crop, missing AP, or leaked home identifiers; do not post secret-bearing logs. Restore the frozen accepted T14 bundle only with the exact recorded revision/hash and command in [T14-BRINGUP.md](T14-BRINGUP.md). Its lack of Wi-Fi is intentional. This rollback retains existing NVS unless Jeremy deliberately erases flash; no broad flash erase is part of this task.

[HARDWARE.md](HARDWARE.md) records the accepted T14 pin/panel evidence. T15 physical radio/reset/persistence evidence has not yet been collected. GPIO21 is not EPD power; unused peripherals stay disabled. ADC uses global 11dB attenuation to avoid the premature per-pin initialization warning; T17 still owns calibration and pack thresholds.

Primary library/API sources checked 2026-10-07: [official v2.0.17 release](https://github.com/tzapu/WiFiManager/releases/tag/v2.0.17), [pinned WiFiManager implementation](https://github.com/tzapu/WiFiManager/blob/v2.0.17/WiFiManager.cpp), and [Arduino3.2.1 WiFi implementation](https://github.com/espressif/arduino-esp32/blob/3.2.1/libraries/WiFi/src/WiFiGeneric.cpp). These explain nonblocking portal processing, NVS save/erase, bounded save waits and initial storage selection.
