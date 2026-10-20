# T16 — remaining checks with the battery installed

Prepared 2026-10-19, America/Denver. This resumes [T16 / PR #21](t16-review.md); it does not close its remaining acceptance criteria. Jeremy has authorized the remaining firmware checks on battery and still has no suitable multimeter. No new flash is needed for this procedure.

Jeremy reports an installed **Easylander630, 3.7 V, 600 mAh, 2.2 Wh** pack, roughly ten hours of charging with the indicator changing red → green, and a recent display update with USB unplugged. Exact charge, unplug and update times were not supplied. Record these as user reports, not measured capacity, charge percentage, battery life, calibrated voltage or sleep current.

The last known approved firmware is source `3fc1e59235b4fc3b456c2b6d75aa380965899cc1`, production app SHA-256 `4d9e35cfeaf3b712abc5eb2737b95fcd4c5e3d45bd077f2c8c031df977e8a648`. Installed bytes have **not** been re-verified this session. The old no-pack/continuous-USB instructions in the review packet describe the earlier setup; record the actual power arrangement below for each new observation.

Model recommendation for this T16 documentation implementation and its independent QA: **GPT-6.1 Sol · High** for each, available in this session's runtime model list. The orchestrator owns Git, WORKLOG, Notion and acceptance reconciliation. Jeremy handles physical buttons, power, network availability and private provisioning; the agent handles any later Terminal/capture commands. Do not start another card or merge/deploy from this procedure.

## What this can establish

With USB unplugged, timed notes/photos or video can document panel retention, visible changes, flicker, button actions and battery-powered operation. A changed footer supports receipt of a later rendered frame. The footer is the **server's frame-render time**, not the device fetch/wake time; it can remain old because publishing is late. No flicker can mean an identical successful fetch, an unsuccessful attempt, or no wake.

Actual TIMER/BOOT wake causes, join duration/failure, accepted 15,000-byte fetches, SHA identity decisions and return to deep sleep require the sanitized device trace specified in [the review packet](t16-review.md) and [evening QA](t16-evening-qa.md). An unchanged panel alone cannot prove them. Even a sleep log does not measure sleep current. Preserve the existing partial passes; do not relabel these new visual checks as complete trace evidence.

Reconnecting ordinary USB interrupts the **battery-only** condition and may reset/wake the device. It cannot recover past serial output. A later USB-powered capture is a separately labeled evidence run; rediscover the port and record any reset/cold wake. Do not assume a “data-only” cable isolates USB power; no battery-only serial arrangement is established here. No multimeter work is requested, and the documented measurement-unavailable alternative remains valid. Battery thresholds/glyph remain provisional until T17.

## Needs Jeremy — staged observations

Keep USB unplugged for the battery observations, note the power state, and start with a weather frame displayed, saved Wi-Fi available and both buttons released. Record wall time with seconds and timezone, photograph the whole panel, and copy its footer exactly. Do not press RESET, disconnect the pack or hold BOOT while reconnecting power. Use the record template after every stage.

### 1. USER remains unused

Choose a quiet point between scheduled slots, at least five minutes from the next `:00`/`:30` target, after any preceding activity has settled. Briefly press/release **USER**, then observe for at least one minute without touching BOOT. Expected visual result: same panel/footer and no flicker, setup or reset. A scheduled update near the press confounds this check; repeat at a quiet point if needed. Record “no visible response”; absence of an actual wake remains unproven without a trace. USER is not configured as a sleep wake source in the firmware.

### 2. Short BOOT requests an immediate attempt

With Wi-Fi available and away from a scheduled target, briefly press/release **BOOT** (about half a second, well below five seconds). Record press/release and any refresh times. A changed hosted frame should refresh; the full image transition may include a white-clear phase and then the image. An identical frame should remain steady. No flicker alone does not mean the button failed, and the footer need not advance. Do not keep pressing to force visible change.

Expected traced outcome, when capture is available: `wake ... BOOT-immediate`, successful connection/time/fetch, either `identical-no-redraw` or `changed-refreshed-hibernated-sha-saved`, then sleep. One short sleep-wake release is coalesced with its immediate attempt. Record this stage as visual/behavioral evidence only while unplugged.

### 3. Coordinated Wi-Fi join failure, then recovery

Arrange a brief disruption that is acceptable for everyone using the home network. Jeremy temporarily makes the device's **saved Wi-Fi network unavailable**, including other mesh/access points advertising it. Disabling only the router's WAN/internet leaves Wi-Fi join available and tests a different failure. Do not erase credentials, rename/reconfigure the saved network or change hosting to manufacture this check.

Choose one production target within the active window. Record the network-off time at least two minutes before that target and leave the saved Wi-Fi unavailable through the attempt, until at least one minute after the target. This includes startup and the firmware's bounded 20-second join opportunity; the earlier trace had a wake about 36 seconds early, so do not rely on exactly 20 seconds of lead. If an actual trace is available, keep Wi-Fi unavailable until it records failed join and scheduled sleep, then restore it. Without that trace, this timed interval covers the expected attempt but does **not** prove an actual failed join occurred.

During the outage expect the existing weather frame/footer retained, no refresh and no setup portal. Record any visible departure. With a previously shown weather frame, failed joins should not automatically replace it with setup. Restore the same saved Wi-Fi and record the restoration time. Observe the next scheduled target, or make one brief BOOT press for recovery and label it as BOOT-triggered. A later changed frame supports recovery; unchanged pixels leave recovery inconclusive. Traced completion requires `wifi ... failed-panel-retained`, bounded failed join and next sleep, followed after restoration by successful reconnect/fetch and sleep. A WAN-only outage cannot satisfy the failed-join criterion.

### 4. Three consecutive production slots spanning at least one hour

Run this after Wi-Fi is restored and without button presses or network changes. Choose targets **S, S + 30 minutes, S + 60 minutes**, all within local **05:00–22:00 inclusive**. Start observing five minutes before S and finish five minutes after the third target. For example, 20:00/20:30/21:00 requires 19:55–21:05. If tonight has no complete eligible window left, use the next day. An arbitrary 70 minutes can contain only two slots.

Keep battery power uninterrupted and record observations around each target, including the quiet lead-in, wall times, footer before/after and all flicker. Record “no visible change” honestly when applicable; do not infer a missed slot from unchanged bytes. Preserve whole-panel photos/video for changed frames and compare with the corresponding served preview when available. Do not force a hosted-frame change or re-baseline exports.

This supplies useful battery-only visual evidence. **Full-hour production acceptance stays Pending until a continuous trace covers all three consecutive targets** with actual TIMER causes, target epochs/local wall times, verified fetches, display/SHA outcomes and subsequent sleeps, reconciled with Jeremy's observations. Preserve actual early-wake and fetch times to investigate the earlier approximately 36-second lead; the relevant fetch is at/after the retained nominal target. The old 17:30/18:00 trace spans only 30 minutes and cannot be combined with an untraced later photo to close this criterion. Debug 120-second cycles cannot replace the production hour. If USB must be reconnected to obtain the trace, label that new run's power condition separately and collect a fresh complete window.

### 5. Optional final deliberate BOOT reset and private reprovisioning

Do this last, after the other observations are saved, if Jeremy is ready to clear saved Wi-Fi. The reset check remains an outstanding physical criterion if deferred. Hold **BOOT continuously for at least five seconds**, then release. Bounded network/display work may finish before reset is applied; allow it to return. Expected: approved setup screen and credential reset, not a weather refresh mistaken for setup. Record hold/release/setup times. Do not hold BOOT across a power connection or RESET, which can select the ROM downloader.

Jeremy joins `WeatherStation-Setup` using the public setup password `firstlight`, opens `192.168.4.1` if needed, and enters home Wi-Fi credentials privately. Keep passwords, submission screenshots and private network identifiers out of logs/photos. Expect setup to remain until successful provisioning and the first weather fetch; then confirm weather returns. After it settles, make one genuine short BOOT press to confirm the next press still requests an immediate attempt. Identical bytes can again produce no visible refresh. Preserve trace evidence for reset/provisioning and this subsequent press when available; do not call the reset criterion passed from a silent short press alone.

Stop acceptance and report the exact observation if the panel is cropped/inverted, setup appears unexpectedly, resets repeat, or a captured trace reports `Busy Timeout!`, `panel-timeout`, secret leakage or unverified TLS/fetch. Retain the last frame and evidence for investigation; do not flash or change hosting to troubleshoot under this procedure.

## Observation record

Use one row per action/target. Times below are actual observations, never copied from the footer. Mark unknown values explicitly.

| Local date/time + zone | Action / nominal target | Footer before | Footer after | Flicker / panel result + observed time | Power (USB/pack; changes) | Network off/on times and availability | Photo/video/trace reference; limitation |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

For trace-backed rows also preserve: source/app identity verification status, host timestamp, wake cause, `target_epoch` and local conversion, join duration/outcome, NTP outcome, fetch duration/outcome, display/SHA outcome, sleep seconds/next target and capture gaps. Keep generic application logs sanitized. Record the precise start/end of each battery-only and USB-connected interval.

## Known passes and pending gates before these checks

| Item | Evidence/status entering this run |
|---|---|
| Corrected software/build/initial physical behavior | Prior software QA/approved flash; initial display/SHA save and brief BOOT no-redraw partial Pass. No installed-byte re-verification this session. |
| Production TIMER behavior | Prior 17:30/18:00 traces: partial Pass; missing 18:30 and full-hour trace remain Pending. |
| Earlier photographed frame fidelity | Prior independent visual Pass within its recorded limits; no new contemporaneous pixel/reference claim. |
| Battery operation | Jeremy reports recent update unplugged; exact timing/wake cause unrecorded. New timed checks Pending. |
| USER, scheduled Wi-Fi failure/recovery, five-second reset and later genuine short press | Remaining corrected-T16 physical checks Pending; reconcile each new observation independently. |
| Changed/identical frame acceptance across the complete run | Pending complete trace plus panel observations; no-flicker alone is insufficient. |
| Sleep current | Allowed documented-reason alternative satisfied: no suitable meter. No measured current, calibrated charge or runtime claim. |
| Full T16 closeout | Pending physical evidence, independent reconciliation, Jeremy acceptance, exact-head green CI and explicit merge authorization. |

Record outcomes against these gates without promoting a visual observation into a logged firmware result. T16 stays In progress while required evidence is missing; T17/T19 calibration and battery-life work remain separate cards.
