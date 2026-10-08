# T16 initial production hardware record

Observed 2026-10-07; original acceptance criteria remain required. [Review packet](t16-review.md), [software QA](t16-qa.md), [T16 card](https://app.notion.com/p/3e7d9adbacad8159a797d88686a8ee03).

## Approved first release and upload

Jeremy's “Approve t16” at16:51 MDT replied to the frozen production flash/one-hour-test request, not acceptance/merge/T17. Reviewed PR21 headda21f3b8a55e1e41e995636b7bf401a7e4ff793e had both required CI SUCCESS in run37697987046. All five frozen file hashes and SOURCE_REVISION rechecked before upload. Source068113577d1739da8b7ac13cfc77dec5d3b7d7c6; production app1320544 bytes SHA17122de56f655b7b37bcc3464f310416ec8b48e189730157e95b9b9a0bc29957. Four explicit address/image pairs, DIO80m16MB,115200, automatic default-reset/hard-reset; no broad erase or native Wi-Fi NVS write. Flash exit0 and all four write hashes verified. Board ESP32-S3v0.2,16MB flash/8MBPSRAM; same USB303A:1001 serial2884859F0EFC at /dev/cu.usbmodem114101.

Evidence: [actual flash log](../firmware/logs/t16-initial-production-flash.txt). This section records the initial release. The separately approved corrected production upload and actual startup are recorded in [corrected hardware record](t16-corrected-hardware.md).

## Actual first runtime

Timestamped raw observer attaches without DTR/RTS ioctl and disables HUPCL. Host behavior is not guaranteed reset-free; timer evidence requires actual `outcome=timer`. First release reset is a cold boot, not a scheduled wake. Captured UTC times:

| UTC | Device step | Result |
|---|---|---|
|22:55:16.296|wake|cold-immediate|
|22:55:16.393|ADC|raw0/0.000V, provisional, no pack|
|22:55:22.920|saved Wi-Fi|connected6522ms|
|22:55:23.814|NTP|synced895ms|
|22:55:28.060|verified HTTPS|accepted15000lowbat,4244ms|
|22:55:32.754|display|panel-timeout-sha-not-saved,4687ms|
|22:55:32.809|sleep|248seconds,target1791414000/17:00MDT,debug_interval0|
|22:55:33.050|USB|disconnected for sleep|

Jeremy separately confirms **“Weather layout is visible.”** This establishes a visible first weather transition, but whole-panel fidelity/index comparison and unchanged/offline behavior remain pending.

Host read-only HTTPS snapshot16:55 MDT (`/private/tmp/weather-epaper-t16-hardware-live/verification.json`) returned200, exact15000-byte bins and all published metadata hashes matched. Same static footer11:49AM as earlier host snapshot; publishing punctuality is separate from T16 and hosting is unchanged. Lowbat frame SHA02665c87c79444684e3b5089490152c2c245e7328ed4283721f2acc36ffaee41, preview SHAf7e9264deac467a2a11ba823aa56f5fda8f6c1eada6bdbf00a19504dacbe73e3. No battery presence/charge inference follows from lowbat selection.

## Confirmed software defect and correction gate

The cold display call was4687ms, below the9.99-second BUSY latch; no driver Busy Timeout line appeared. Its failure came from requiring BUSY LOW after hibernate. [Solomon SSD1683 datasheet](https://files.seeedstudio.com/wiki/Other_Display/42-epaper/IC%20Driver%20SSD1683%20Datasheet.PDF), command0x10, printedpage25, specifies BUSY stays HIGH after entering deep sleep. Pinned GxEPD2 sends0x10/0x01 after active power-off completion. The original native fake forced LOW at hibernate and masked this hardware contract. Independent implementation/QA investigation confirms the software defect; the panel is not diagnosed as faulty.

Minimal correction checks active refresh/power-off completion before hibernate, retaining the real timeout latch. Revised native fake models normal deep-sleep HIGH and tests active-stuckHIGH/real-timeout failure. Any corrected release requires separate source, build hashes, independent QA, green required CI and Jeremy flash approval. Initial release withholds SHA and can redraw identical bytes; do not claim unchanged-frame suppression or a successful one-hour run from it. Physical acceptance is paused.

## Actual first scheduled wake

[Timestamped runtime trace](../firmware/logs/t16-initial-production-runtime.txt) records same-board raw reattach22:59:39.238UTC, actual TIMER wake22:59:39.239, saved join1355ms, fresh NTP2911ms, accepted15000lowbat fetch at23:00:01.343UTC. Display again falsely failed after4686ms, then slept1774seconds to target1791415800/17:30MDT. One real nominal17:00 slot observed, not a one-hour pass. Raw diagnostic observer deliberately stopped23:01:04.914UTC. No new source uploaded.

## Current measurement limitation

Jeremy explicitly answered **“No suitable meter available.”** The original criterion allows a documented reason measurement could not be performed; that alternative is recorded. Continuous USB/no pack, no suitable meter; no measured current or battery-life result. T17/T19 must not treat this as a current measurement or battery calibration.

## Remaining evidence

Production scheduled wake span at least one hour on the corrected release, exact preview/whole-panel observations, no redraw/flicker on unchanged frames, saved-Wi-Fi unavailable scheduled wake and recovery, BOOT/USER checks, independent hardware reconciliation and later explicit acceptance/authorized merge. T16 remains In progress; no T17 advancement.
