# ePaper Weather Station — project scope

**Status:** live. This is the single reference for what the project is, what is in and out of scope, and what has been decided. `design/spec.md` holds the pixel-level design contract; this document holds everything else. Where an older document disagrees with this one, this one wins. Last updated 2026-10-07 (orchestration handoff and progress reconciliation).

**Design phase: complete.** All frames are approved (checkpoint 3 closed 2026-09-25), including the setup-screen hotspot password `firstlight`. **Development phase: server complete; firmware and physical verification remain.** The task-by-task plan is `docs/dev-plan.md`; each task is a card in Jeremy's Notion *Dev Tasks* database, and agents log their work in `WORKLOG.md`. §9 records the decisions that plan was built on.

Owner: Jeremy. Software is built with OpenAI Codex; every plan names the model and reasoning level per task (see `AGENTS.md`).

---

## 1. Goal

A single-glance weather display that hangs in Jeremy's closet so he knows what the day's weather will be while getting dressed. Priority order: current temperature first, then the next few hours, then the next few days. Viewing distance is arm's length. Location is fixed: Marriott-Slaterville, UT. Temperatures in °F.

## 2. Hardware

| Item | Value |
|---|---|
| Board | RockBase NM-EPD-420-BW: ESP32-S3, 16 MB flash, 8 MB PSRAM |
| Panel | GYE042A87, 4.2″, 400 × 300 px, 1-bit black/white, ~120 ppi; full refresh 2–3 s |
| Inputs | USER button (GPIO 45), BOOT button (GPIO 0), battery voltage on `BATT_ADC` (GPIO 3) |
| Power | Li-Po battery; deep sleep between refreshes |
| Links | [Product](https://rockbase.shop/en/products/nm-epd-420?variant=42529919762514) · [Wiki](https://wiki.rockbaseiot.com/docs/products/nm-epd-420/) · [Board firmware reference](https://github.com/RockBase-iot/NM-EPD-420) · [Icon and font source](https://github.com/RockBase-iot/esp32-weather-epd) |

Temporary power setup (Jeremy, 2026-10-07): continuous USB until the battery pack arrives in early November 2026. The board is unboxed and no battery was supplied. USB permits firmware bring-up; battery calibration and life acceptance still require the pack.

Enclosure and mounting are undecided. The 4 px safe margin in the design exists for that reason.

## 3. Architecture

**Server-side rendering; the device is a thin client.**

1. A **scheduled job** runs once per refresh slot, shortly before the device wakes. It fetches weather from the NWS API, computes civil dawn/dusk, lays out the frame with the same library that produces the design exports (`design/lib/render.js` → rasterize → threshold), and publishes two files to **static hosting**: a raw 1-bit framebuffer and a PNG.
2. The **device** wakes on schedule, joins Wi-Fi, downloads the raw framebuffer (400 × 300 / 8 = 15,000 bytes, panel byte order, no decoder needed), writes it to the panel, measures its battery voltage locally (serial diagnostics, no telemetry endpoint), and deep-sleeps until the next slot. It draws nothing of its own.
3. Nothing stays running. The device fetches a fixed URL under Jeremy's domain, `builtbyjer.com`.

Consequences:

- The served frame must be pixel-identical to the design exports for the same data. The fixtures in `design/fixtures/` are the renderer's test vectors, and `design/review-instructions.md` requires a zero-pixel diff.
- No Adafruit-GFX font conversion and no on-device layout.
- **Low battery (decided 2026-09-25):** static hosting cannot read a query parameter, so the server publishes **two frames every slot**, one normal and one with the low-battery glyph. The device measures its own voltage and downloads whichever applies. The device still draws nothing; both frames are pixel-exact outputs of the same renderer.
- **Pixel identity across machines (decided 2026-09-25):** the renderer runs inside a pinned container image (Node, `sharp`, librsvg, fontconfig, freetype all fixed) so a laptop and the CI runner produce identical bytes. The exports in `design/exports/` are the reference. If the pinned environment cannot reproduce them exactly, the exports are re-baselined from the container **once**, with Jeremy's explicit re-approval, and that becomes the new reference.
- The device asks only for Wi-Fi during setup. Location, units, and schedule are fixed for Jeremy's closet and live in the renderer's configuration.
- **Wake scheduling (decided 2026-09-25):** the device syncs NTP on every wake and computes the next half-hour slot itself using a fixed `America/Denver` POSIX TZ rule. The server does not tell the device when to wake.
- **Hosting (decided 2026-09-25):** GitHub Actions on a cron schedule renders and publishes to GitHub Pages, served at a subdomain of `builtbyjer.com`. The repository is public so Actions minutes are unlimited.

## 4. Data

| Need | Source | Notes |
|---|---|---|
| Current observation, hourly forecast, daily forecast | National Weather Service API, `api.weather.gov` | Free, no key. US only. |
| Civil dawn and civil dusk | Computed on the server from fixed latitude/longitude | Also defines day vs night for icon variants. |
| Local time and DST | Server, `America/Denver` | The server uses `America/Denver`; the device syncs NTP and computes its own next wake with the approved POSIX TZ rule (see §3 and §9 row 7). |

**Semantics decided:**

- Hourly marks show the NWS hourly forecast for that exact hour (the 3 PM row is the 3 PM forecast, not an aggregate).
- Daily rows use the NWS **daytime** period for condition and precipitation chance; high from the day period, low from the following night.
- Day runs from civil dawn through civil dusk; everything else is night. This picks the day/night icon variant for the current reading and each hourly mark.
- A precipitation percentage is shown only when above zero, and then the condition icon must visibly carry the precipitation type.

## 5. What the screen shows

Defined pixel-exactly in `design/spec.md`. In brief: current temperature and condition icon (dominant), the next civil dawn or dusk labeled `FIRST LIGHT` / `LAST LIGHT`, the next four future 3-hour marks (12/3/6/9 AM/PM) with temperature, icon, and chance, three days starting tomorrow with icon, high/low, and chance, and a footer with refresh icon, last-update timestamp, optional low-battery glyph, and the Sovereign Aperture logo at right.

Not shown, by decision: section headings, location text, separate precipitation-type glyphs, wind, humidity, UV, AQI, pressure, moon phase, indoor temperature, date header, graphs.

## 6. Display states

| State | Status | Behavior |
|---|---|---|
| Normal | **Approved** (checkpoint 2) | Five fixtures: summer, winter, spring, worst-case widths, night. |
| Wi-Fi setup / first boot | **Approved** (checkpoint 3) | Full-screen instruction with the logo: connect to `WeatherStation-Setup` with password `firstlight` (shown on screen), then open `192.168.4.1`. Stays on the panel until the first frame is downloaded. |
| Low battery | **Approved** (checkpoint 3) | 14 px glyph in the footer when voltage is below the agreed threshold. Nothing else moves. The server publishes a normal and a low-battery frame each slot; the device chooses by its own voltage reading with hysteresis. |
| Fetch failed / stale | In scope, **no visual** | The previous frame and its timestamp stay on the panel. The timestamp only advances on fresh data, so an old timestamp is the staleness signal. The device may skip the redraw. |
| Before the first frame | In scope, **no visual** | The setup screen remains until the first frame lands. A device that cannot join Wi-Fi reopens the setup hotspot. |
| Severe weather alert | **Removed** 2026-09-25 | Renders archived under `design/exports/archive/`. Do not implement. |
| `DATA STALE` badge | **Removed** 2026-09-25 | Renders archived. Do not implement. |

Precedence: setup is full screen until the device is provisioned and has a frame. After that the only overlay is the low-battery glyph.

Re-entering setup (**decided 2026-09-25**): the **BOOT button (GPIO 0)** is the user button. A press wakes the device and triggers an immediate refresh; holding it for five seconds clears Wi-Fi credentials and returns to the setup screen. The USER button (GPIO 45) is unused because it is not an RTC pin and cannot wake the ESP32-S3 from deep sleep.

## 7. Refresh schedule and power

- Refresh every 30 minutes, on the hour and half hour, from **5:00 AM through 10:00 PM** local time (35 refreshes per day).
- No refreshes overnight. The 10:00 PM frame stays up until 5:00 AM. Its first two hourly marks are in the past by morning; accepted.
- Deep sleep between refreshes.

## 8. Out of scope

Enclosure design (until mounting is decided), any weather source other than NWS, alerts, indoor sensors, configurable location or units, partial-refresh animation, on-device rendering, and a separate screen for the gap before the first frame.

## 9. Development-planning decisions (2026-09-25)

The handoff items from the scope review were resolved in the planning session with Jeremy on 2026-09-25. The resulting plan is `docs/dev-plan.md`. Decisions:

| # | Item | Decision |
|---|---|---|
| 1 | Version control | GitHub, public monorepo `jeremyward37/weather-epaper` containing `design/`, `server/`, `firmware/`, `tools/`. The working clone lives at `~/codeProjects/weather-epaper`, **outside iCloud Drive**, because iCloud sync corrupts `.git`. The iCloud folder becomes a frozen copy with a pointer to the repo. |
| 2 | NWS condition mapping | A documented table from NWS icon codes / `shortForecast` / `probabilityOfPrecipitation` to the 30 icon semantics, with test vectors, is its own task before the fetch client is written. |
| 3 | Low-battery threshold | Two frames published per slot (normal, low-battery); the device picks by voltage with a hysteresis band. Threshold and band are set once the battery pack is known (Jeremy task). |
| 4 | Battery life | In scope: measured over weeks after first deployment, and used to size the pack. |
| 5 | Hosting | GitHub Actions cron → GitHub Pages at `weather.builtbyjer.com` (DNS CNAME added by Jeremy). The local-time schedule runs at 4:47 AM and :17/:47 from 5 AM through 9 PM `America/Denver`, preparing all 35 device wakes through 10 PM. The job checks the window, allows a delayed final scheduled run shortly after 10 PM, and never publishes on a failed fetch, so the previous frame stays live. Jeremy approved the extra 4:47 AM publish on 2026-09-27 to serve the 5:00 AM wake. |
| 6 | Wire format | Raw 15,000-byte, 1 bit per pixel, row-major, 50 bytes per row, MSB first, `1 = white` as GxEPD2 expects. T14 setup photo from Jeremy on 2026-10-07, matching embedded-byte checks and independent visual QA, confirms this default on the actual panel without inversion/repacking. See `firmware/HARDWARE.md`. Button evidence passed; Jeremy accepted T14 and authorized its merge and T15 start on 2026-10-07. PR #19 merged as `08be1ac`; Jeremy subsequently accepted T15 and merged PR #20 as `637c275`. T15 is Done; T16 is In progress with its separate software/release/physical gates (see `docs/t16-review.md`). |
| 7 | Wake scheduling | Device: NTP each wake, compute next slot locally, deep sleep. |
| 8 | Setup hotspot | Captive portal at `192.168.4.1`, SSID `WeatherStation-Setup`, password `firstlight`; BOOT held five seconds clears credentials (USER cannot wake from deep sleep). Setup screen bytes are embedded in firmware. |
| 9 | Repository layout | Monorepo; `server/` imports the layout code from `design/` as a library after a zero-diff refactor. |
| 10 | Firmware framework | PlatformIO, Arduino framework, GxEPD2, matching RockBase's reference code. |
| 11 | Frame verification | `tools/framediff.py` compares any two frames (PNG or raw) and reports differing pixels; CI fails on any drift of `design/exports/`. |
| 12 | Enclosure and mounting | Still undecided; not blocking. |
| 13 | Execution | One card per implementation run, coordinated by a persistent Codex orchestrator with implementation and independent QA subagents, then a Jeremy review pause (`docs/orchestration.md`). Each run has its own branch and log entry; hardware evidence and explicit acceptance gate Done. Jeremy-only actions remain his. **[PD]** marks physical-board work; the board arrived 2026-10-06 and Jeremy confirmed it unboxed on 2026-10-07; T14 physical acceptance is complete; later firmware and battery acceptance remain pending. |
| 14 | Repository visibility | Public. Can be switched later in repository settings; a private repo meters Actions minutes and needs GitHub Pro for Pages. |

## 10. Document map

| Document | Role |
|---|---|
| `docs/scope.md` (this file) | Project scope, architecture, decisions, development-planning decisions |
| `docs/dev-plan.md` | Development plan: phases, task list with Notion links, model and token recommendations |
| `docs/orchestration.md` | Roles, execution protocol, review gates, start/resume prompt |
| `docs/orchestration-state.md` | Current gate and approval/evidence ledger |
| `WORKLOG.md` | Agent work log: one entry per task session, with the required template |
| `design/spec.md` | Pixel-exact design contract |
| `design/decisions.md` | Design rationale and dated decision log |
| `design/icon-map.md` | Condition → icon mapping and bitmap inventory |
| `design/review-instructions.md` | Pass/fail protocol for the implementation |
| `docs/scope-review.md` | Dated log of the 2026-09-25 scope review; superseded by this file where they differ |
| `docs/design-brief.md`, `docs/context.md` | Historical background |
