# NM-EPD-420-BW hardware record

Status: **setup photo, runtime memory, USB-only no-pack ADC and both button transitions observed 2026-10-07; Jeremy accepted and authorized merge; T14 Done and PR #19 merged**. Jeremy flashed the reviewed spike. This T14 run uses continuous USB power and an empty battery connector; a pack is not expected until early November. Battery calibration, actual battery voltage and power consumption remain unmeasured.

## Primary sources

- [RockBase board repository](https://github.com/RockBase-iot/NM-EPD-420), especially [pin definitions](https://github.com/RockBase-iot/NM-EPD-420/blob/main/src/config.h), [build configuration](https://github.com/RockBase-iot/NM-EPD-420/blob/main/platformio.ini), and [display initialization](https://github.com/RockBase-iot/NM-EPD-420/blob/main/src/ui/display_helper.h). Read from the current vendor sources on 2026-10-07.
- [RockBase wiki](https://wiki.rockbaseiot.com/docs/products/nm-epd-420/) and [schematic](https://github.com/RockBase-iot/NM-EPD-420/blob/main/docs/sch/SCH_NM-EPD-420-V1.0.pdf). Charger details were gathered on the T14 card on 2026-09-25; this session has not independently measured or inspected the charger circuit.
- [pioarduino 54.03.21 release](https://github.com/pioarduino/platform-espressif32/releases/tag/54.03.21) (Arduino-ESP32 3.2.1 / ESP-IDF 5.4.2) and [GxEPD2 1.6.8 release](https://github.com/ZinggJM/GxEPD2/releases/tag/1.6.8).
- [Vendor B/W demo API](https://github.com/RockBase-iot/nm-epd420-bw-demo/blob/main/docs/EPD_API.md) is referenced by the T14 card's earlier investigation for raw polarity and byte order. This session's web fetch of that document was unavailable; verify against the installed pinned driver and, decisively, Jeremy's panel photo.

## Board and pins

ESP32-S3R8: 16 MB QSPI flash and 8 MB on-package OPI PSRAM. USB Type-C is native ESP32-S3 USB (GPIO19/20), not a UART bridge; `ARDUINO_USB_MODE=1` and `ARDUINO_USB_CDC_ON_BOOT=1` expose the application serial console. Firmware uses the vendor's `lilygo-t-display-s3` PlatformIO board with explicit flash/memory overrides; pins come from `src/board.h`, not that development board's default display pins.

| Signal | GPIO | Contract |
|---|---:|---|
| EPD SCK | 2 | SPI output |
| EPD MOSI | 1 | SPI output |
| EPD MISO | none (`-1`) | Write-only panel, NC |
| EPD CS | 46 | Chip select |
| EPD DC | 4 | Data/command |
| EPD RST | 5 | Reset |
| EPD BUSY | 6 | Active HIGH for GYE042A87 |
| USER | 45 | External pull-up; LOW pressed; cannot wake deep sleep |
| BOOT | 0 | External pull-up; LOW pressed; RTC / boot strap |
| BATT_ADC | 3 | ADC1_CH2; sensed rail through 2:1 divider |
| ADC_EN | 43 | HIGH enables divider; LOW between samples |
| TEMP_CTL | 40 | AHT20 supply; LOW for this spike |
| PA_CTRL | 41 | Audio amplifier enable; LOW |
| CODEC_EN | 44 | ES8311 supply; LOW |
| LORA_EN | 47 | LoRa supply; LOW; no antenna needed for this non-radio test |
| SD CS / LoRa NSS | 7 / 8 | Both deselected HIGH; neither bus initialized |

EPD power is hard-wired to 3V3; **GPIO21 is I2S MCLK, not EPD power**. This project does not copy the misleading EPD power definition from the weather-demo port. Disable unused power-gated modules before initializing the display. Panel hibernation stops its controller after refresh; it does not put the ESP32 into deep sleep. No LoRa or Wi-Fi stack was initialized in the T14 spike; T15 initializes Wi-Fi.

## Display and wire format

Panel: GYE042A87, 400 × 300, black/white, SSD1683. Pinned driver: `GxEPD2_420_GYE042A87` in GxEPD2 1.6.8, with `GxEPD2_BW<..., 300>`. Vendor sequence: `SPI.begin(2, -1, 1, 46)`, `display.init(115200, true, 2, false)`, `selectFastFullUpdate(true)`, rotation 0. The spike writes all bytes at `(0,0)` with `writeImage`, `invert=false`, `mirror_y=false`, `pgm=true` for the embedded PROGMEM asset, then `refresh(false)` (full refresh) and `hibernate()`. The installed 1.6.8 `src/other/GxEPD2_420_GYE042A87.{h,cpp}` confirms the overload, active-HIGH BUSY, row-major indexing and `pgm_read_byte` on ESP32; its initial buffer clean can add a white clearing refresh before the setup frame.

Software wire contract: **15,000 bytes**, no header/compression, 1 bpp, row-major, 50 bytes per row, MSB first, **1 = white / 0 = black**. Pixel `(x,y)` is bit `7 - (x % 8)` of byte `y * 50 + x / 8`; origin is the top-left. `firmware/assets/setup_frame.h` is generated from the approved PNG by `node server/bin/pack-setup.js`, using `server/config.json`. Firmware does not draw text, decode PNG, reverse bits, or invert colors.

A zero-pixel comparison of embedded bytes with `design/exports/states/state-setup.png` establishes software packing fidelity. Jeremy's actual photo [photos/t14-setup.jpg](photos/t14-setup.jpg), supplied as IMG_2842.JPG, establishes upright/unmirrored text and logo, black-on-white polarity, complete content and no visible crop, shift or missing columns. The orchestrator and separate QA both passed visual comparison with the canonical setup PNG. Camera angle and lighting limit this to visual inspection, not a pixel measurement of the photo. The frame used the default row-major/MSB-first/1=white wire contract without correction; scope §9 and decisions record this evidence. Jeremy explicitly accepted T14 on 2026-10-07; PR #19 is merged.

## ADC, power and charger

Enable GPIO43 HIGH, wait 80 ms, average 24 raw 12-bit conversions and 24 adjacent calibrated `analogReadMilliVolts(3)` conversions with 11 dB attenuation, then disable GPIO43. Formula: `sense_mV = average ADC_mV × 2`. Raw and mV are separate adjacent conversions; rounding may differ slightly. Runtime diagnostics print both button levels alongside voltage every two seconds.

ADC calibration is supplied by Arduino/ESP-IDF; the board divider, voltage under load, and useful battery thresholds still need meter measurements in T17. T14 does not infer pack presence or enforce thresholds. With no pack and USB attached, the sensed rail may reflect charger/backfeed or an unstable unloaded circuit. Preserve the observed reading with the explicit note **USB-only; battery connector empty**. There is no required no-pack numeric target, and such readings cannot establish battery life or charge level.

Earlier vendor schematic/card findings: LGS4056HEP linear Li-ion charger (TP4056 class), CHRG/DONE LEDs, no exposed charger-status GPIO, a slide switch on the battery input, and JST 1.25 mm two-pin battery connector (red positive, black negative). The vendor recommends a protected 3.7 V Li-Po of at least 500 mAh. Connector naming in vendor prose is inconsistent; verify pitch and polarity on the actual board before selecting a pack in T17. No pack selection or purchasing is part of T14.

Sleep current is unpublished. Earlier schematic review noted AMS1117-3.3 and MD5333 regulators; actual sleep rail behavior and current remain unknown. The continuously awake USB spike is not evidence for the later battery/deep-sleep design.

## Observed hardware record

Jeremy flashed implementation `4ac387dbbbb3672b11672222f360a83804c8d615`, app SHA-256 `197954ed939d99b47ab43c8115749adb3fe8078ff43f5075bb58c5717018589d`. Esptool connected to ESP32-S3 QFN56 revision v0.2, verified the app write, and returned to the shell. After normal reset, application serial reports `Flash=16777216 PSRAM=8388608`, completed refresh and stable increasing timestamps. Selected actual serial lines: [logs/t14-runtime-initial.txt](logs/t14-runtime-initial.txt). Photo SHA-256 `fe30c95d6e9d05e4e06aab4f796bfb203ee00ee2a15512f7571212e024ebe00b`; the original file was copied without editing.

Startup warnings were independently traced in the pinned sources. The premature per-pin ADC attenuation call is ignored before lazy channel initialization; the default is already `ADC_11db`, which the first read uses. GxEPD2 presets CS/RST/DC before `pinMode`; Arduino 3 rejects these initial writes, then the driver configures the pins and repeats the writes, including the reset pulse. These one-time messages did not block the observed frame or later diagnostics. No subsequent ADC error, Busy Timeout or reset loop is present in the supplied excerpt. Removing these messages would require a new reviewed build; the current verified artifact is unchanged.

| Check | Evidence needed | Current result |
|---|---|---|
| Setup frame and wire format | Reviewed revision + flashed SHA-256 + whole-panel photo at `photos/t14-setup.jpg`; Jeremy confirms orientation, crop, shift and polarity | Photo, separate visual QA and Jeremy acceptance Pass |
| USB-only ADC | Actual raw / ADC_mV / sense_mV lines, power source and no-pack note | Observed raw=0 / ADC_mV=0 / sense_mV=0, USB-only with no pack; not a battery measurement |
| USER / BOOT | Each released HIGH → held LOW → released HIGH in serial | Pass: USER at 643956→645959→649965 ms; BOOT at 649965→651968→653971 ms; actual excerpt `logs/t14-buttons.txt` |
| Flash / PSRAM | Startup capacity line, no reset loop / panel timeout | Observed 16777216 / 8388608 bytes; stable diagnostics, no timeout in supplied output |
| Battery readings, calibration and sleep current | Pack and meter measurements in later cards | Not attempted |

Exact flash, monitor, downloader recovery and stop/rollback steps are in [T14-BRINGUP.md](T14-BRINGUP.md). All original technical criteria have observed/software evidence. T14 is Done after Jeremy acceptance and authorized merge with green CI. T15 radio/reset/power-cycle/timer-persistence original checks are now observed and independently reconciled; acceptance/authorized merge remain pending. See ../docs/t15-hardware-qa.md for limits.

T14 merged revision: `08be1ac4024d1c79c25814f0881469804ab096a8` (PR #19). Current T15 build/test/hardware instructions are in [README.md](README.md); hotspot, credential persistence, reset behavior and one bounded timer-sleep cycle have actual evidence; exact normal restored. Final review gates and unrun recommended physical cases are in ../docs/t15-hardware-qa.md.


## T16 sleep, TLS and ADC implementation record (2026-10-07)

T16 replaces the awake provisioning loop with scheduled timer/ext0 wake, verified raw-frame fetch and deep sleep. Software checks/builds do not establish physical wake, TLS, panel or current behavior; those T16 observations remain pending Jeremy's reviewed release. The earlier T14 **24-sample** ADC paragraph describes that accepted diagnostic artifact; T16 explicitly averages **16** raw and **16** adjacent calibrated mV readings, waits the same 80 ms and uses the same ×2 divider. Values 3.55 V / 0.10 V are provisional until T17. The observed empty-pack USB ADC zero selects the low-battery binary by that voltage rule; it is not a battery-presence or charge measurement.

The [vendor sleep pattern](https://github.com/RockBase-iot/NM-EPD-420/blob/main/src/test_runner.cpp) holds PA_CTRL, LORA_EN, CODEC_EN, ADC_EN, TEMP_CTL and **LORA_RST GPIO12** LOW, with LoRa NSS HIGH, using per-pin `gpio_hold_en` and `gpio_deep_sleep_hold_en`. T16 includes that reset pin and deselects SD/EPD as well. EPD power remains hard-wired to 3V3: no invented power-enable GPIO is used. EPD hibernates before reset is held LOW. GPIO0 LOW ext0 uses the external pull-up, is returned from RTC mux with `rtc_gpio_deinit` before early button sampling, and is armed only with BOOT released. USER GPIO45 cannot wake. See [ESP-IDF 5.4.2 sleep documentation](https://docs.espressif.com/projects/esp-idf/en/v5.4.2/esp32s3/api-reference/system/sleep_modes.html). Actual sleep rail behavior/current is unmeasured; continuous USB and no pack limit battery-loop measurements.

Pinned SDK configuration enables the **full ESP certificate bundle** and RTC/high-resolution system time. T16 uses [ESP-TLS nonblocking connections](https://docs.espressif.com/projects/esp-idf/en/v5.4.2/esp32s3/api-reference/protocols/esp_tls.html) and bounded asynchronous lwIP DNS, then sends an HTTP/1 GET with `Connection: close`. The numeric connection address does not disable host verification: `common_name` supplies the original DNS hostname for SNI and mandatory name checks, with `crt_bundle_attach=esp_crt_bundle_attach`. The [pinned TLS source](https://github.com/espressif/esp-idf/blob/v5.4.2/components/esp-tls/esp_tls_mbedtls.c) sets `mbedtls_ssl_set_hostname` from that field and requires verification with the bundle; it also maps a graceful TLS close notification to EOF. The strict header parser is heap allocated to preserve the Arduino loop stack for TLS.

Root separately verified the custom hostname and GitHub Pages endpoint on 2026-10-07: custom leaf issuer Let's Encrypt **YR2**, fallback issuer Let's Encrypt **YR1**; intermediate names are observations, not hard-coded firmware pins. The full bundle includes trusted roots (including ISRG Root X1) rather than assuming an old intermediate. The live status/length/hash/zero-pixel report is [../docs/t16-live-endpoint.md](../docs/t16-live-endpoint.md). Desktop trust verification does not prove the actual device handshake; Jeremy's first successful verified fetch remains a physical gate. No insecure fallback exists.

The pinned GxEPD2 refresh API returns void. T16's callback/edge tracker conservatively latches a nearly ten-second stuck-HIGH BUSY interval and checks LOW after hibernation, withholding SHA commits on that observed error. Successful BUSY completion still does not prove correct glass pixels or protect against disconnected/stuck-LOW BUSY; whole-panel photos and Jeremy's changed/unchanged observations remain required. A durable `framePending` metadata marker before a changed display write suppresses automatic portal replacement after an interrupted or failed first-frame commit; it denotes an unknown panel state, not a physical success claim.
