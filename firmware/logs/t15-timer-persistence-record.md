# T15 bounded timer-sleep persistence — 2026-10-07

Jeremy approved T15 normal flash/persistence harness/normal restore and authorized root Terminal commands. Resumed after his explicit restart. Same board now uses /dev/cu.usbmodem114101. Source b8ae0c4c1680d6fd3857b6d413248e298599d8ee; harness app SHA-256 302af824bfe29974268d555605b6acb756945d4f16f13f93471d203d05a4fbd2, 1,140,000 bytes. SOURCE_REVISION and all five file hashes checked before upload. Explicit esptool offsets 0x0000/0x8000/0xe000/0x10000, DIO/80m/16MB; --before default-reset --after hard-reset. Native NVS at0x9000 preserved; no broad erase. Upload succeeded, all four data hashes verified.

Selected verbatim flash lines (progress/device MAC omitted):

```text
esptool.py v5.0.0-dev1
Chip type:          ESP32-S3 (QFN56) (revision v0.2)
Features:           Wi-Fi, BT 5 (LE), Dual Core + LP Core, 240MHz, Embedded PSRAM 8MB (AP_3v3)
USB mode:           USB-Serial/JTAG
Flash will be erased from 0x00000000 to 0x00004fff...
Flash will be erased from 0x00008000 to 0x00008fff...
Flash will be erased from 0x0000e000 to 0x0000ffff...
Flash will be erased from 0x00010000 to 0x00126fff...
Wrote 18880 bytes (12214 compressed) at 0x00000000 in 0.3 seconds (482.6 kbit/s).
Hash of data verified.
Wrote 3072 bytes (137 compressed) at 0x00008000 in 0.0 seconds (507.9 kbit/s).
Hash of data verified.
Wrote 8192 bytes (47 compressed) at 0x0000e000 in 0.1 seconds (646.3 kbit/s).
Hash of data verified.
Wrote 1140000 bytes (660054 compressed) at 0x00010000 in 8.9 seconds (1023.9 kbit/s).
Hash of data verified.
Hard resetting via RTS pin...
```

Actual runtime: t15-timer-persistence.txt. Saved config connected before sleep, one timer sleep entered, USB disappeared, raw serial reattached without DTR/RTS ioctl (HUPCL disabled), saved config connected and harness reported Timer wake reconnected; persistence observed. No setup portal/redraw or FAIL line in capture. Observer was manually stopped after success. The harness checks actual ESP_SLEEP_WAKEUP_TIMER and savedReconnect, not eventual portal recovery. This closes bounded timer-sleep saved-credential persistence; it does not implement/verify T16 scheduling, ext0 wake or battery life.

t15-resume-reconnect.txt shows normal saved reconnect after Jeremy's earlier reported physical USB cycle and elapsed pause; opening that pyserial capture caused an additional USB reset. His physical panel stayed unchanged. The unplug event itself was not captured because the earlier bounded observer had ended. A second directly observed physical cycle and BOOT/reset/failure/photo checks remain pending.

Exact normal restored successfully and saved reconnect observed; see t15-normal-restore-record.md. Bounded harness removed. Independent epaper_qa audit confirms this one actual timer-sleep saved persistence cycle Pass. Success requires actual TIMER wake, RTC marker and savedReconnect; a USB reset or portal recovery cannot produce it. Configured ten seconds was not independently timed, and raw serial is not a universal reset-free guarantee.
