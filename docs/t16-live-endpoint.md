# T16 live endpoint preflight — 2026-10-07

Read-only observation at 2026-10-07 16:11 MDT. No device, hosting, DNS or publisher change. This is host-side endpoint evidence, not ESP32 TLS or panel acceptance.

## Verified endpoint and trust

The custom domain and fallback hostname both completed TLS 1.3 with certificate-chain and hostname verification using Python 3.12 and certifi. Host Python 3.13’s default CA lookup first failed with missing local issuer; curl’s host trust succeeded, and the isolated PlatformIO venv with certifi verified successfully. No verification bypass was used.

| Host | Observed intermediate issuer | Leaf expiry (UTC) |
|---|---|---|
| weather.builtbyjer.com | US, Let's Encrypt, YR2 | Dec 29 17:54:39 2026 GMT |
| jeremyward37.github.io | US, Let's Encrypt, YR1 | Oct 31 23:38:01 2026 GMT |

The configured root/bundle must validate the actual chain; intermediate/leaf observations are time-specific and not a pinning recommendation. Firmware TLS verification remains an independent software/build/hardware check.

## Published snapshot

Cache-busted HTTPS GET `https://weather.builtbyjer.com/<file>?t=1791411084`. Metadata renderedAt `2026-10-07T17:49:48.796Z`; footer `10/7 11:49 AM`. This snapshot is older than the observation time; the already recorded T21 publisher punctuality concern remains a separate card. T16 displays valid received bytes and retains the prior frame on fetch failure; no stale badge is added.

| File | HTTP | Bytes | SHA-256 |
|---|---:|---:|---|
| meta.json | 200 | 680 | `6fe82efd3ca632a7ef3a2951ee8effa5bd16e9e4752106d1905ec73a5d9dcbe9` |
| frame.bin | 200 | 15000 | `491ea07966699134da831955d5a4bdcd109719490ff780a05cddaa62151459a7` |
| frame-lowbat.bin | 200 | 15000 | `02665c87c79444684e3b5089490152c2c245e7328ed4283721f2acc36ffaee41` |
| frame.png | 200 | 2996 | `c08a87ac5bd6dad2fe92618f923b1ff02091638625ec267e250babf2be6f00bd` |
| frame-lowbat.png | 200 | 3018 | `f7e9264deac467a2a11ba823aa56f5fda8f6c1eada6bdbf00a19504dacbe73e3` |
| index.html | 200 | 1331 | `3b9c058be18b858350bd1e6397b79e04603201c7e8b03931296dc7ec495b60b9` |

All five file hashes match meta.json. Both bins are exactly 15,000 bytes with content type application/octet-stream. `tools/framediff.py` using repository-pinned Pillow 12.3.0:

- normal bin vs published normal PNG: 0 differing pixels (exit 0).
- low-battery bin vs published low-battery PNG: 0 differing pixels (exit 0).
- normal vs low-battery bin: 100 pixels inside approved footer region136,281,14,10, zero outside; exit1 expected for glyph difference.

System Pillow initially lacked get_flattened_data; the tool was rerun unchanged with pinned Pillow in `/private/tmp/weather-epaper-t16-image-venv`. No check was weakened. These live frames are not canonical fixture re-baselines.

Commands (working directory: T16 managed worktree):

```sh
/private/tmp/weather-epaper-t16-image-venv/bin/python tools/framediff.py /private/tmp/weather-epaper-t16-live/frame.bin /private/tmp/weather-epaper-t16-live/frame.png
/private/tmp/weather-epaper-t16-image-venv/bin/python tools/framediff.py /private/tmp/weather-epaper-t16-live/frame-lowbat.bin /private/tmp/weather-epaper-t16-live/frame-lowbat.png
/private/tmp/weather-epaper-t16-image-venv/bin/python tools/framediff.py /private/tmp/weather-epaper-t16-live/frame.bin /private/tmp/weather-epaper-t16-live/frame-lowbat.bin --region 136,281,14,10
```

Raw snapshot and machine-readable verification are temporary at `/private/tmp/weather-epaper-t16-live/`. Physical changed/unchanged/offline frames and scheduled wake traces remain Pending until an approved T16 flash and Jeremy observations.
