# T15 normal flash observation — 2026-10-07

Agent-performed Terminal upload following Jeremy's approval of T15 flash/persistence and his request that the agent run Terminal commands. Automatic bootloader entry succeeded. Source b8ae0c4c1680d6fd3857b6d413248e298599d8ee; reviewed head 250ec59bdb3a7351a5012867098c4b1ded9b1ee2. Normal app SHA-256 736c18b0ae031f60d32c1980192d0bc36a9de83fa0afa4f646ba0494a3556b3a, 1,132,240 bytes. SOURCE_REVISION and all five SHA256SUMS passed before upload.

The command in docs/t15-review.md was executed with `--before default-reset` instead of `--before no-reset`, on /dev/cu.usbmodem14101. All four explicit address/file pairs and DIO/80m/16MB options were unchanged. No erase-flash; native NVS preserved. Upload returned exit 0; each written image reported its data hash verified.

Selected verbatim tool-output excerpt (not a full flash transcript):

```text
Wrote 1132240 bytes (655044 compressed) at 0x00010000 in 8.8 seconds (1024.2 kbit/s).
Hash of data verified.
Hard resetting via RTS pin...
```

Full bounded startup capture: t15-first-startup.txt. Opening the serial monitor produced USB_UART_CHIP_RESET, not evidence of a spontaneous boot loop. Normal runtime reached setup and logged AP IP 192.168.4.1 without the T14 GPIO/ADC warnings in this capture. Actual phone reachability, private save, power-cycle reconnect, BOOT reset and timer-sleep persistence remain pending. No credential identifiers/passwords appear in these evidence files.
