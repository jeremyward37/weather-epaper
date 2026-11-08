# All-day half-hour updates — 2026-11-08

Jeremy requested a weather update every 30 minutes with no overnight break.

## Coordinated schedule

- Google Cloud Scheduler: `weather-epaper-half-hour`, `us-central1`, `15,45 * * * *`, timezone `America/Denver`. Existing dispatch target/token/body/retries unchanged.
- GitHub fallback: identical :15/:45 every hour; no server publish-time restriction.
- Display: fetch on :00/:30 continuously, nominally waking 20 seconds early to join Wi-Fi. Overnight, midnight and DST transitions are included.
- Nominal publishing lead: 15 minutes. Actual runner, NWS and Pages latency can still miss a wake; verify publication completion and live `meta.json`.
- Normally 48 wakes/day, about37% more than the previous35. Power usage/battery life is not yet measured for this cadence.

## Firmware provenance

The installed runtime is from unmerged PR21. This branch integrates its firmware and native/CI tests from `04b8cd97dfe23dff2530d170ff595f10fe4b5257`, then changes only scheduling and adds overnight regressions. It preserves current-main T24 renderer/approved exports. Prior physical acceptance gaps are not retroactively passed.

## Validation and installation

Native provisioning, all-day schedule, runtime and network regression tests passed; all 358 server tests passed with bundled Python/Pillow. The pinned production build succeeded. App SHA-256: `5cada2ee834d400776ed108f6c317e861cc2081dfb0190dfb9602d14031ffe4c` (1,319,184 bytes), built from firmware source in `46c73d1`.

On 2026-11-08 the agent read a 3 MiB rollback application region, then flashed the four production images at explicit offsets on `/dev/cu.usbmodem114101`. All four writes verified successfully; no NVS erase. Local backup and hashes: `/private/tmp/weather-epaper-all-day-release/`. Startup reported cold-immediate and ADC3.907V, then entered Wi-Fi setup; private re-provisioning and a successful live fetch are pending. Keep native Wi-Fi credentials by flashing without erasing NVS; partitions stay unchanged. Do not use the debug or persistence-test image as production.

## External configuration

Jeremy confirmed during this session that he changed the existing Google job to `15,45 * * * *`, preferring quarter-hour footer timestamps. Google Console/API access is not available to the agent; this is user confirmation, not API verification. America/Denver and existing target/credentials/retries were requested unchanged. Server deployment and actual publication completion remain to be verified.
