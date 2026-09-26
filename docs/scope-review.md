# Scope review — 2026-09-25

> **Log.** This is the working record of the review session. The consolidated, live scope is [scope.md](scope.md); where the two differ, `scope.md` wins.

Purpose: everything found while reading the whole project folder that has to be resolved, cleaned up, or decided before development planning can start. Updated the same evening with Jeremy's decisions; resolved items are kept for the record and marked **Resolved**. Build status at last update: `./build.sh` printed `PASS` (5 normal + 2 state frames: setup, low battery).

Legend: **Fix** = housekeeping an agent can do without a decision. **Decide** = Jeremy's call. **Clarify** = spec text is ambiguous and must be tightened. **Design** = a state or behavior that has no mockup yet.

---

## 0. Decisions made 2026-09-25

| Topic | Decision | Recorded in |
|---|---|---|
| Rendering | Server-side. A server runs this pipeline and serves the finished 1-bit frame; the device downloads and displays it. | `design/spec.md` "Rendering architecture", `design/decisions.md` |
| Power and schedule | Li-Po battery. Refresh every 30 minutes, 5:00 AM through 10:00 PM local; no refreshes overnight. | `design/spec.md` "Refresh schedule" |
| Weather data | National Weather Service API. Civil twilight computed server-side. | `design/spec.md` "Refresh schedule" |
| Day/night boundary | Civil dawn through civil dusk is day. | `design/spec.md` "Content and formatting" |
| Hourly mark semantics | The NWS hourly forecast for that exact hour, not an aggregate. | `design/spec.md` "Content and formatting" |
| Severe weather alert | Removed from scope. Renders archived, fixtures archived, pipeline and docs updated. | `design/decisions.md`, `design/exports/archive/` |
| Stale badge | Removed from scope. A failed fetch keeps the previous frame; the footer timestamp is the staleness signal. | `design/spec.md` "Fetch failed" |
| Daily row | NWS daytime period for condition and precipitation chance. | `design/spec.md` |
| Server hosting | Scheduled job renders each frame before the device wakes and writes it to static hosting. | `design/spec.md` "Rendering architecture" |
| Wire format | Raw 15,000-byte 1-bit framebuffer; PNG alongside for review. | `design/spec.md` |
| Setup screen text | `WeatherStation-Setup` and `192.168.4.1` are final as rendered. Hotspot password is a firmware-plan detail. | `design/decisions.md` |
| Git and iCloud | Stay in iCloud; `git init` at the start of the development phase. | `design/decisions.md`, README |
| Wi-Fi setup and failure states | In scope. Setup already exists; two new states added (first fetch after setup, never-succeeded failure). | `design/spec.md` "States still to be designed" |
| Physical legibility | Verified by Jeremy. Closed. | `design/decisions.md` |
| Duplicate root files | Removed. The last leftover, root `assets/refresh-icon.png`, was confirmed byte-identical to `design/assets/source/refresh-icon.png` and deleted. | — |
| AGENTS.md rule 10 | Removed. | `AGENTS.md` |
| Status labels | Unified to "normal state approved at checkpoint 2; edge states and spec pending checkpoint 3". | all four design docs, README |

## 1. Repo housekeeping

| # | Item | Kind | Status / detail |
|---|---|---|---|
| 1.1 | Duplicate root copies | Fix | **Resolved.** |
| 1.2 | Not a git repository | Fix | **Deferred** to the development phase by Jeremy. First development task: `git init` and a baseline commit of the approved design. |
| 1.3 | Project lives in iCloud Drive | Decide | **Resolved:** stays in iCloud. Known side effect: `name 2.png` conflict copies can appear in `design/assets/icons/`; the default build clears the folder and `verify.py` rejects extras. Noted in README. |
| 1.4 | AGENTS.md rule 10 stale | Fix | **Resolved.** Removed. |
| 1.5 | Status labels disagree | Fix | **Resolved.** |
| 1.6 | Legacy `hourly` arrays in fixtures | Decide | **Open.** Each normal fixture still carries the six-slot `hourly` array that feeds only the archived six-hour render, and `validateNormal()` still enforces it. The fixtures become the server's test vectors, so the dead field is a trap. Recommendation: drop `hourly` from canonical fixtures and from `validateNormal()`; keep it only in `fixtures/archive/`. |
| 1.7 | Unused fonts | Fix | **Resolved.** Spec now states Lato Regular and Raleway Regular are the only fonts the server needs. |
| 1.8 | Inset values differ by 1 px | Clarify | **Resolved.** Spec now states solid rules are inset 5 px and dotted dividers 6 px, both intentional. |
| 1.9 | Codex model names may be stale | Fix | **Resolved.** AGENTS.md rule 9 now says to re-verify the model list. |

## 2. Spec ambiguities

| # | Item | Kind | Status / detail |
|---|---|---|---|
| 2.1 | Day/night boundary | Decide | **Resolved:** civil dawn/dusk. |
| 2.2 | 3-hour mark semantics | Decide | **Resolved:** exact-hour NWS values. |
| 2.3 | Daily values | Decide | **Resolved:** NWS daytime period for condition and chance; high from the day period, low from the following night period. |
| 2.4 | Temperature bounds | Clarify | **Resolved.** Bound restated by character count; out-of-range data is treated as a failed fetch. |
| 2.5–2.8 | Alert rules | Decide | **Resolved by removal.** |
| 2.9 | Stale timing | Clarify | **Resolved by removal.** The badge is gone; the spec's "Fetch failed" section says a failed fetch (server or device side) leaves the previous frame and timestamp untouched. |
| 2.10 | Low-battery threshold | Clarify | **Open.** Needs a voltage threshold and hysteresis. The device reports voltage on each request and the server draws the glyph (spec updated). The number itself belongs in the firmware plan once the battery pack is chosen. |
| 2.11 | Setup screen values | Decide | **Resolved:** the rendered text is final. Whether the setup hotspot is password-protected is decided in the firmware plan. |

## 3. States and behaviors

| # | Item | Kind | Status / detail |
|---|---|---|---|
| 3.1 | First fetch after setup | Design | **In scope, not designed.** Needs a mockup, fixture, and export. Options: keep the setup screen with a status line, or a minimal "Connecting…" frame using the setup layout. |
| 3.1b | Never-succeeded failure | Design | **In scope, not designed.** A provisioned device with no stored frame whose fetch fails. Likely shares 3.1's design. |
| 3.1c | Device-side stale overlay | Design (task) | **Dropped** with the badge. When the device cannot reach the server it keeps the frame already on the panel and may skip the redraw. |
| 3.2 | Wi-Fi lost vs API error | Decide | **Resolved:** both leave the previous frame in place; no indicator of either. |
| 3.3 | Power source | Decide | **Resolved:** battery, 5 AM–10 PM half-hourly. Follow-ups for the plan: battery-life estimate (35 wakes/day, each with Wi-Fi + ~15 KB download + full refresh), pack size, and whether the board's charging path exists. |
| 3.4 | Re-entering setup | Decide | **Open.** Proposal: long-press the USER button (GPIO 45) to clear Wi-Fi credentials and return to the setup screen. |
| 3.5 | Configurable vs hardcoded | Decide | **Open.** Location, time zone, units, and schedule live on the server now, so the device needs only Wi-Fi credentials and the server URL. Recommendation: server settings as a config file; device settings via the captive portal (Wi-Fi) plus a compile-time server URL. |
| 3.6 | Physical legibility | Decide | **Resolved:** verified by Jeremy. |
| 3.7 | Adafruit-GFX font metrics | Spike | **Moot** under server-side rendering. |

## 4. Development-planning decisions

| # | Item | Kind | Status / detail |
|---|---|---|---|
| 4.1 | Where rendering happens | Decide | **Resolved:** server. |
| 4.1b | Where the server runs | Decide | **Resolved:** scheduled job + static hosting, rendering once per refresh slot ahead of the device's wake. The specific host (GitHub Actions, Cloudflare, S3, a home machine) is a plan-level pick. |
| 4.1c | Frame format on the wire | Decide | **Resolved:** raw 15,000-byte buffer; PNG alongside. |
| 4.2 | Weather data source | Decide | **Resolved:** NWS. **Open deliverable:** the condition-mapping table from NWS `shortForecast` / icon URL / `probabilityOfPrecipitation` to the 30 semantic icon names and precipitation type. This is the missing link between `icon-map.md` and the server. |
| 4.3 | Civil twilight source | Decide | **Resolved:** computed on the server from fixed coordinates. |
| 4.4 | Time and DST | Clarify | **Mostly resolved.** The server owns all displayed times (`America/Denver`). The device still needs a clock to wake on schedule: NTP at each wake, or a schedule the server sends with each frame ("next wake in N seconds"). Recommendation: the server includes the next-wake delay in the response so the device never needs a time zone. |
| 4.5 | Firmware framework | Decide | **Open, but smaller.** Arduino/PlatformIO with GxEPD2 for the panel driver is the path of least resistance and matches RockBase's reference code. Firmware scope is now: connect Wi-Fi, GET raw frame, write to panel, read battery ADC, deep-sleep until next wake, captive portal for setup. |
| 4.6 | Frame verification | Task | **Resolved in principle.** `review-instructions.md` §7 now requires a pixel diff between the served frame and the export (zero differing pixels), plus a photo of the panel. Needs a small diff script in the server repo. |
| 4.7 | Repo layout and plan format | Decide | **Open.** Proposal: this repo gains `server/` (Node, imports `design/build.js` layout code directly) and `firmware/` (PlatformIO). Plan document with Codex model per task, per AGENTS.md rule 9. |
| 4.8 | Enclosure and mounting | Decide (later) | **Open, not blocking.** |

## 5. Checkpoint 3 sign-off list

Approved so far: normal state (checkpoint 2), physical legibility. Still needing explicit approval:

1. Setup state.
2. Low-battery state (glyph; voltage threshold deferred to firmware plan).
3. The two new states once designed (3.1, 3.1b).
4. `design/spec.md` as the implementation contract.

## 6. Suggested order

1. Agent: drop legacy `hourly` arrays (1.6); design 3.1/3.1b (first fetch after setup, never-succeeded failure); rebuild; `verify.py` PASS.
2. Checkpoint 3 review of setup, low battery, and the two new states.
3. Agent: write the NWS condition-mapping table (4.2) and the server + firmware plan with model recommendations per task. First plan task is `git init` and a baseline commit.
