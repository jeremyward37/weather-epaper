# All-day half-hour updates — 2026-11-08

Jeremy requested a weather update every 30 minutes with no overnight break.

## Coordinated schedule

- Google Cloud Scheduler: `weather-epaper-half-hour`, `us-central1`, `17,47 * * * *`, timezone `America/Denver`. Existing dispatch target/token/body/retries unchanged.
- GitHub fallback: identical :17/:47 every hour; no server publish-time restriction.
- Display: fetch on :00/:30 continuously, nominally waking 20 seconds early to join Wi-Fi. Overnight, midnight and DST transitions are included.
- Nominal publishing lead: 13 minutes. Actual runner, NWS and Pages latency can still miss a wake; verify publication completion and live `meta.json`.
- Normally 48 wakes/day, about37% more than the previous35. Power usage/battery life is not yet measured for this cadence.

## Firmware provenance

The installed runtime is from unmerged PR21. This branch integrates its firmware and native/CI tests from `04b8cd97dfe23dff2530d170ff595f10fe4b5257`, then changes only scheduling and adds overnight regressions. It preserves current-main T24 renderer/approved exports. Prior physical acceptance gaps are not retroactively passed.

## Validation and installation

Pending: full build/test results, production image hash, USB flash and actual runtime trace. Keep native Wi-Fi credentials by flashing without erasing NVS; partitions stay unchanged. Do not use the debug or persistence-test image as production.

## External configuration

Google Console/API access is not available in this chat. Change the existing job's Frequency to `17,47 * * * *` as described in runbook.md. Confirm actual external configuration separately; a code change cannot edit the Google job.
