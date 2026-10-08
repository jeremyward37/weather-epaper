# T24 accepted release record

Jeremy accepted the concrete T24 LO/HI reference correction and authorized merge/publication: “accept please merge and publish”.

- Accepted PR22 head: `1457a2586635f2bad81d568a8cbfa4e372a7884f`; independent software/exact-commit QA Pass; both required CI jobs SUCCESS in [run37722545839](https://github.com/jeremyward37/weather-epaper/actions/runs/37722545839).
- [PR22](https://github.com/jeremyward37/weather-epaper/pull/22) squash merged at2026-10-07 21:43:20MDT as `28ca02a9e41ffc540438a09dee4abedf5d683a22`.
- [Publish37724074874](https://github.com/jeremyward37/weather-epaper/actions/runs/37724074874) checked out that merged revision; render and deploy SUCCESS. Pages reported success at03:44:23UTC.
- Public endpoint: https://weather.builtbyjer.com/; rendered2026-10-08T03:44:06.001Z, footer10/7 9:44PM.

Independent release QA and root verification Pass: all six public canonical HTTPS files matched this run’s deployed github-pages artifact byte-for-byte. Five metadata SHA-256 values matched; metadata remained stable when fetched again. Both raw payloads are15000bytes and equal their corresponding mode1 400×300 PNG pixel bytes, confirming row-major MSB-first1=white. Normal and low-battery previews both visibly read `54°/82°`, `58°/82°`, `51°/78°` for Thu/Fri/Sat.

| File | Bytes | SHA-256 |
|---|---:|---|
| frame.bin | 15000 | `8f90ad1c77e14018962257d12ceafe7d3f418fce468b47e0460d336a4c8ff715` |
| frame-lowbat.bin | 15000 | `85c8f9ffeee42a7d3061c6e1e82ef16c6055b0dedca2f703bb36fead32cab84b` |
| frame.png | 3015 | `d96c0073d8745cfa8b31de72226875370a3a119e4db079665a112252a61ba01d` |
| frame-lowbat.png | 3037 | `cfcea3dc6183776f308c701937f02e67b88086f2eadf17d8a05e4f7e8c06c0c9` |
| index.html | 1331 | `3b9c058be18b858350bd1e6397b79e04603201c7e8b03931296dc7ec495b60b9` |
| meta.json | 679 | `8e00fc792f1ef1755de8776d593cbb2043fb1aab77da1e0d1aaedcec76bb7cc5` |

Reproduction/evidence: `/private/tmp/t24-verify-public.py`, `/private/tmp/weather-epaper-t24-published/verification.json`, publisher artifact11527710071 and run log. PNG/raw files are generated; never hand-edited. Public weather can change on later scheduled publications; these hashes describe the verified9:44PM release.

T24 acceptance/re-baseline/merge/publication complete. No firmware flash or physical panel observation in this release; the installed weather firmware receives LO/HI on a later successful fetch. T16’s original full-hour/offline/button/acceptance gates and meter limitation remain separate. No new implementation task started.

This record only documents the already authorized and verified release; it changes no renderer, canonical frame, firmware, data mapping, hosting configuration or publishing workflow.
