# T15 normal firmware restored — 2026-10-07

After the successful bounded sleep cycle, root restored the exact approved normal bundle: source b8ae0c4c1680d6fd3857b6d413248e298599d8ee; app SHA-256 736c18b0ae031f60d32c1980192d0bc36a9de83fa0afa4f646ba0494a3556b3a, 1,132,240 bytes. Source/all five file hashes verified before write. Same explicit four offsets, DIO/80m/16MB and default-reset/hard-reset options on rediscovered /dev/cu.usbmodem114101. NVS preserved. Upload returned success and all four data hashes verified.

Selected verbatim flash lines (progress/device MAC omitted):

```text
esptool.py v5.0.0-dev1
Chip type:          ESP32-S3 (QFN56) (revision v0.2)
Features:           Wi-Fi, BT 5 (LE), Dual Core + LP Core, 240MHz, Embedded PSRAM 8MB (AP_3v3)
USB mode:           USB-Serial/JTAG
Flash will be erased from 0x00000000 to 0x00004fff...
Flash will be erased from 0x00008000 to 0x00008fff...
Flash will be erased from 0x0000e000 to 0x0000ffff...
Flash will be erased from 0x00010000 to 0x00124fff...
Wrote 18880 bytes (12214 compressed) at 0x00000000 in 0.3 seconds (472.0 kbit/s).
Hash of data verified.
Wrote 3072 bytes (137 compressed) at 0x00008000 in 0.0 seconds (537.1 kbit/s).
Hash of data verified.
Wrote 8192 bytes (47 compressed) at 0x0000e000 in 0.1 seconds (648.7 kbit/s).
Hash of data verified.
Wrote 1132240 bytes (655044 compressed) at 0x00010000 in 8.8 seconds (1030.6 kbit/s).
Hash of data verified.
Hard resetting via RTS pin...
```

Immediately attached raw serial without DTR/RTS ioctl/HUPCL and observed:

```text
[OBSERVER] Raw serial attached; no DTR/RTS ioctl; HUPCL disabled
[T15] Wi-Fi provisioning; USER unused; BOOT hold 5s resets
[T15] Saved Wi-Fi connected; panel retained
```

Normal firmware is installed and awake; bounded harness removed. Ongoing capture at /private/tmp/weather-epaper-t15-restored-normal-runtime.txt will supply later BOOT/power-cycle observations. Host tty opening may still affect modem state, so raw attach is not a universal reset-free guarantee. Physical button/second power cycle/photo/failure checks remain pending.
