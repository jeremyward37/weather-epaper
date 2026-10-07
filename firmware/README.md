# T14 USB bring-up

This spike boots the RockBase NM-EPD-420-BW, transfers the embedded approved setup frame directly to the GYE042A87 panel, performs a full refresh, and hibernates the panel. The driver may first perform an initial white clearing refresh. The ESP32 stays awake and prints ADC and button diagnostics every two seconds. There is no Wi-Fi, HTTP, credential storage, or ESP deep sleep; the setup hotspot instructions on the frame are artwork for this test. T15 implements the hotspot, and T16 implements the scheduled device loop.

Jeremy's current test uses continuous USB power with the battery connector empty. A battery is not expected until early November. T14 accepts a documented no-pack reading; battery calibration, thresholds and life remain T17/T19 work. See [HARDWARE.md](HARDWARE.md) for source evidence and the pending physical checks.

## Install and build

PlatformIO Core **6.1.18** is the tested CLI version. Use the VS Code PlatformIO extension, or `pipx install platformio==6.1.18` followed by `pipx inject platformio esp-idf-size==1.6.1` if pipx is already installed. A Python virtual environment keeps Python build packages outside the global interpreter:

```sh
python3 -m venv /private/tmp/weather-epaper-t14-venv
cd ~/codeProjects/weather-epaper
/private/tmp/weather-epaper-t14-venv/bin/python -m pip install -r firmware/build-requirements.txt
export PATH="/private/tmp/weather-epaper-t14-venv/bin:$PATH"
export PLATFORMIO_CORE_DIR=/private/tmp/weather-epaper-t14-pio
pio run -d firmware -e nm-epd-420-bw
```

The first build downloads the vendor-pinned **pioarduino 54.03.21** platform, Arduino-ESP32 **3.2.1**, and the toolchain. `platformio.ini` pins GxEPD2 **1.6.8**, Adafruit GFX **1.12.1**, and BusIO **1.17.4**. It follows the vendor's `lilygo-t-display-s3` board definition, with 16 MB flash, DIO flash mode, `qio_opi` memory (8 MB OPI PSRAM), 80 MHz CPU, native USB CDC, and `huge_app.csv` partitions. This partition layout uses only part of the 16 MB flash; no filesystem or OTA feature is needed in T14. No fallback platform is selected.

The vendor platform's installer also caches toolchains under `~/.platformio/tools`, even when `PLATFORMIO_CORE_DIR` points elsewhere. The first local build created that vendor cache; it was left intact. The temporary core directory does not fully isolate these downloads. This is the unmodified vendor platform; CI runs it on a disposable clean runner. `build-requirements.txt` also pins `esp-idf-size` **1.6.1**, because pioarduino 54.03.21 invokes the `--ng` option removed in 2.x. Install those requirements in the Python environment used by PlatformIO; an IDE-managed environment needs the same helper pin.

The local app is `firmware/.pio/build/nm-epd-420-bw/firmware.bin`. A build alone proves neither panel fidelity nor battery/button operation. CI's separate `firmware` job performs a clean `pio run`, then uploads the app, ELF, bootloader, partitions, `SHA256SUMS`, source revision, and PlatformIO version. `firmware.bin` is an application binary, not a merged flash image; use PlatformIO upload to place all components correctly.

Record the actual app hash before flashing:

```sh
shasum -a 256 firmware/.pio/build/nm-epd-420-bw/firmware.bin
```

Local macOS and CI Linux builds may produce different binary hashes. Record the hash of the artifact actually flashed and its reviewed Git revision; do not assume a CI artifact and a local rebuild are identical.

## Needs Jeremy

Only Jeremy plugs in or flashes the board. Use the reviewed revision named in the review packet, after approval to flash. Keep the battery connector empty for this run. Leave LoRa unused; this firmware drives its power gate LOW and never transmits.

1. With both buttons released, plug the board into the Mac using the USB data cable. Discover its native USB port:

   ```sh
   pio device list
   ```

2. Substitute that `/dev/cu.usbmodem...` port below; close any Arduino IDE or other serial monitor using it. From the repository root, flash and open the monitor:

   ```sh
   pio run -d firmware -e nm-epd-420-bw -t upload -t monitor --upload-port /dev/cu.usbmodemPORT --monitor-port /dev/cu.usbmodemPORT
   ```

   If the USB port renumbers after upload, exit with Control-C, run `pio device list` again, then:

   ```sh
   pio device monitor -d firmware -e nm-epd-420-bw --port /dev/cu.usbmodemPORT --baud 115200
   ```

3. Let the panel finish flashing black/white and settle on the setup screen. Compare it with `design/exports/states/state-setup.png`. Photograph the whole panel straight-on, including all edges: text and logo upright, black on white, no mirroring, crop, shift, or missing columns. Save the photo as `firmware/photos/t14-setup.jpg` and attach it to the T14 Notion card. Do not rotate, invert, or retouch the photo to hide a mismatch.
4. Copy several serial lines with both buttons released. Hold USER for at least three seconds, release for three seconds, then hold BOOT for three seconds and release. Do not reset or reconnect with BOOT held during this button test. Capture each LOW and return to HIGH. Buttons only report levels in T14.
5. Record: Git revision, actual flashed app SHA-256, USB-only power, battery connector empty, observed ADC values, USER/BOOT transitions, photo path and interpretation. Serial has no network secrets in T14. The startup memory line should report `Flash=16777216 PSRAM=8388608`; retain any discrepancy or `Busy Timeout!` diagnostic.

Serial field shape (placeholders, not measured evidence):

```text
[T14] ms=<time> BATT_ADC_raw=<0..4095> ADC_mV=<calibrated pin reading> sense_mV=<ADC_mV*2> USER=1 BOOT=1 (LOW=pressed; pack presence unknown)
```

`analogReadMilliVolts` uses the ESP32 ADC's calibration; the divider tolerance and battery voltage have not been calibrated against a meter. `sense_mV` is a voltage on the sensed battery rail, not USB's 5 V or proof of an attached pack. With an empty connector, charger/backfeed or floating-node behavior can produce zero, nonzero, or varying values. Record the actual no-pack reading without accepting it as state of charge. ADC enable returns LOW after each averaged reading.

## Upload and serial recovery

If no port appears, verify the data cable/USB connection and run `pio device list`. To enter the ESP32-S3 ROM downloader, hold BOOT while reconnecting USB, then release BOOT after enumeration. Use the newly listed port for the upload command. Once upload finishes, disconnect/reconnect USB with BOOT released if the application does not start; rediscover its application CDC port and open the monitor. This is recovery only, not a credential-reset feature.

The firmware waits at most three seconds for serial, so an unopened monitor cannot prevent drawing. Startup output may have occurred before a monitor attaches; periodic diagnostics continue. If startup output is needed, open the monitor and reconnect/reset with BOOT released, then rediscover the port if necessary. A panel timeout, USB reset loop, zero PSRAM, or visually incorrect frame is failed bring-up evidence to return to the agent; successful compilation does not override it.

## Stop / rollback

There is no deployment, Wi-Fi configuration or server change in this spike. Before flashing, rollback is just discarding the proposed source revision; leave the device untouched. After flashing, stop the test by closing the monitor and disconnecting USB. E-paper retains its image without power. To restore previous device behavior, Jeremy must explicitly choose and flash a known previous firmware or vendor image; this project has no captured factory backup. Do not erase flash or change server packing flags as an automatic recovery action.

If the photographed frame is inverted or bit-reversed, report it. T14's card directs any approved wire-format correction through `server/config.json` and `server/bin/pack-setup.js`, followed by another physical check; never compensate with on-device layout or edits to the canonical PNG. Orientation/crop defects likewise require investigation and a reviewed fix. Keep T14 In progress until all physical checks, independent QA, green CI, review and merge gates are met.
