# Weather display design decisions

Status: **Design approved.** Checkpoint 3 closed 2026-09-25: Jeremy approved the setup and low-battery screens, which with the checkpoint 2 normal state completes the design. The setup screen's `Password: firstlight` line was added after that review and approved by Jeremy the same day. E3 with four fixed three-hour marks is the selected design.

## T06 renderer extraction — 2026-09-26

- Exported the layout as a CommonJS module in `lib/render.js` so the Node server can call it directly. `build.js` is the file-writing CLI over the same functions; no anchors, font sizes, or frame pixels changed.
- The `lowBattery` API option takes precedence over the fixture field. This preserves the approved night low-battery fixture while allowing the server to produce both variants from one data object.
- The Node `toOneBitPng` function emits a grayscale, bit-depth-1 PNG at luminance cutoff 160. The CLI retains Python `threshold.py` for its existing export and preview workflow.

## Selection and content

Jeremy chose the two-column ledger family, E’s full-width current area, and E3’s single dotted horizontal line below current conditions plus a dotted vertical line between forecast columns. There are no forecast row dividers. The early concepts remain in `exports/archive/`.

The selected normal screen omits the `CURRENT`, `NEXT 6 HOURS`, and `NEXT 5 DAYS` headings and the fixed home location. It shows three days starting tomorrow. Separate precipitation-type glyphs were removed; the condition icon shows rain, snow, mix, or thunder, and a percentage appears only when positive. The user’s requests supersede the earlier six-hour, five-day, separate-glyph, centered-logo, and footer-location requirements in `../docs/design-brief.md`.

The hourly column now shows **the next four strictly future three-hour marks** from 12 AM, 3 AM, 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, and 9 PM local time. For example, at 4:58 PM the screen shows 6 PM, 9 PM, 12 AM, and 3 AM. At exactly 3 PM, the first mark is 6 PM. A six-consecutive-hour alternative is retained in `exports/archive/normal-6hour-*.png` for reference; the canonical `normal-*.png` exports are the selected four-mark design.

## Current normal layout

- Canvas: 400 × 300 px, 1-bit black and white, at least 4 px from all screen edges.
- Current area: 66 px Weather Icons condition bitmap anchored at x=10, and Raleway Regular 76 px temperature at x=82. Their **visible ink** is centered at y≈55, including `-12°` through `108°`.
- Civil twilight: `FIRST LIGHT` or `LAST LIGHT` in Lato Regular 14 px at x=255, visible center y≈31; 30 px dawn/dusk horizon icon at x=255 and Lato Regular 22 px time at x=293, both centered at y≈64. Only the next civil event appears.
- Dividers: 1 px dotted line from x=6 to 394 at y=94, and 1 px dotted line at x=209 from y=102 to 263. Footer rule: 1 px solid line from x=5 to 395 at y=272.
- Hourly: four rows with visible centers y=121, 161, 201, and 241. The fixed, left-aligned columns are **time** x=8 / Lato Regular 18 px, **temperature** x=70 / 22 px, **condition icon** x=119 / 32 px, and **precipitation chance** x=164 / 15 px. Zero chance leaves the final column blank without shifting the others. The icon sits closer to typical temperatures while retaining clearance for `100°` and `-12°`.
- Daily: three rows with visible centers y=126, 178, and 230. Day at x=218 / Lato Regular 18 px, condition icon at x=260 / 36 px, low/high at x=303 / Lato Regular 20 px. The chance percentage, when present, is a separate subordinate line at x=303, visible center 20 px below the main row, in Lato Regular 16 px. Low/high uses `/` throughout (T24, 2026-10-07).
- Footer: refresh bitmap 14 px at x=7, Lato Regular 14 px last-update text at x=27, optional 14 px low-battery glyph at x=136, and 20 px Sovereign Aperture logo right-aligned to the content edge at x=375. Each element’s visible ink is centered around y=285.5; there is no location text.

The renderer measures the visible black pixels of each text string and rasterized icon, then computes its placement from the desired center line. In the final 1-bit PNGs, the measured centers of current icon/temperature, sun icon/time, each hourly row, each daily main row, and footer items agree within 0.5 px. Fixed column anchors avoid horizontal jitter as values and precipitation vary. The synthetic width fixture fits `108°`, `100%`, `-24°/-12°`, and `12/31 12:58 PM` without collision; the closest forecast gap to the divider is 7 px.

## Icon treatment and assets

The fixture validator rejects positive chance paired with a generic or mismatched condition icon. A 5% rain slot, for example, uses a showers icon. The separate precipitation glyphs remain only for the archived early concepts.

Weather Icons can look delicate at very small sizes. The selected four-mark format makes hourly icons 32 px and daily icons 36 px. During the firmware asset cleanup, every mapped condition was rasterized at 66, 32, and 36 px regardless of fixture use. The thresholded 1× and nearest-neighbor 3× assets showed that flurries looked like ordinary snow and hail's pellets nearly vanished at 32 px. `build.js` now reinforces the two flurries variants with wind strokes and the two hail variants with square ice pellets at each live size. Their cloud artwork still comes from the listed Weather Icons SVGs. The remaining newly generated overcast, fog, wind, drizzle, and smoke marks remained legible at all three sizes.

The default build clears `assets/icons/` and emits only the 96 firmware handoff bitmaps listed in `icon-map.md`: 30 conditions at three sizes, two civil-event icons, refresh, low battery, and two logo sizes. The four precipitation-type glyphs and concept-size samples are produced only by `--all` for the historical archive. Asset verification checks the complete default manifest, dimensions, 1-bit pixels, and the absence of extra files; `--all` checks the required subset alongside the historical assets. No canonical frame uses the reinforced flurries or hail marks.

The [RockBase esp32-weather-epd repository](https://github.com/RockBase-iot/esp32-weather-epd), commit `ff5001b`, supplied the Weather Icons SVG set and font sources. Selected SVGs and TTFs are copied into `assets/` to rebuild locally. Weather Icons, Lato, Raleway, and Montserrat use SIL OFL 1.1; Roboto Mono uses Apache 2.0 per the repository’s [licensing table](https://github.com/RockBase-iot/esp32-weather-epd#licensing). SVG text is rasterized to 1 bit with kerning disabled. Adafruit-GFX font conversion is no longer needed: rendering moved to a server that runs this same pipeline (2026-09-25).

The refresh artwork and a snapshot of the Sovereign Aperture logo are vendored in `assets/source/`; the logo master and usage rules are in the sibling `personal-logo` project (see `assets/source/SOURCES.md`). Jeremy requested the logo in the right footer zone. The 20 px choice keeps the footer compact; 18 px loses diamond detail, while 24 px needs more vertical room. Those alternate logo exports remain available. The arch and diamond proportions are unchanged. The original low-battery source collapsed at 14 px, so a simple 1-bit battery outline replaces it. The dawn/dusk icons come from `wi-sunrise.svg` and `wi-sunset.svg`, but the labels explicitly mean civil dawn/dusk.

## Edge-state decisions

- **Stale badge: removed from scope on 2026-09-25.** The earlier design kept the last-good frame and added a small outlined `DATA STALE` badge in the footer after 90 minutes. Jeremy judged the badge unnecessary: the footer timestamp already shows when the data was last updated. A failed fetch now simply leaves the previous frame and timestamp in place. Renders are archived as `exports/archive/state-stale.png` and `state-combined.png`.
- Wi-Fi setup is a separate full-screen two-step instruction with the larger logo, `WeatherStation-Setup`, and `192.168.4.1`. It shows no cached weather. No QR code was added because it would take space and needs device-specific network provisioning to be useful. On 2026-09-25 Jeremy asked for the hotspot to have a simple password shown on the screen, so a `Password: firstlight` line was added under the network name and the step rows were re-spaced (centers 155/179/203/239/263). `firstlight` meets the 8-character hotspot minimum and echoes the display's `FIRST LIGHT` label; Jeremy approved it on 2026-09-25.
- The low-battery glyph remains a footer overlay and is now the only footer overlay; the `normal-night` fixture is also exported as `state-low-battery` for state review.
- **Severe weather alert: removed from scope on 2026-09-25.** Jeremy judged it not useful enough for this display. The strip design (outlined band under the hero, compressed forecast rows) is archived in `exports/archive/state-alert.png`, `state-alert-long.png`, and `state-combined-with-alert.png`, with fixtures in `fixtures/archive/`.

## Verification and checkpoint

Five fixtures cover no precipitation, 100% snow/mix, 5% chance and thunder across midnight, synthetic width extremes, clear/partly-cloudy night conditions, and low battery. The build validates slot counts, the strictly future three-hour marks, tomorrow’s first day, and icon/precipitation consistency. Every current normal export is 400 × 300, PNG mode `1`, with only pure black and white. The review page presents physical-width, native, and nearest-neighbor 3× views.

After the final build and threshold pass, `python3 design/verify.py` passed for five selected normal and two state exports (setup, low battery). It checked 400 × 300 mode-1 black/white output, ≥4 px content margins, visible center alignment within 0.5 px in the reference render, ≥7 px hourly gaps, 1-bit icon assets, and 62 review-page image references. I visually inspected every state at 1× and the setup state at 3×. `spec.md` documents implementation coordinates; `review-instructions.md` gives the implementation agent a pass/fail protocol.

Checkpoint 3 closed on 2026-09-25: Jeremy approved the setup and low-battery screens. Physical legibility of the exports (13–14 px footer text, 1 px strokes in the 32 px icons) was checked by Jeremy the same day and accepted. Nothing in the design awaits his word.

## Scope decisions — 2026-09-25

Made by Jeremy during the scope review recorded in `../docs/scope-review.md`.

- **Rendering happens on a server.** A server runs the same pipeline as this design folder (`build.js` layout → rasterize → threshold) and serves the finished 400 × 300 1-bit frame; the ESP32-S3 downloads and displays it. Reason: the spec is exact by construction, the Adafruit-GFX font-conversion risk disappears, and firmware shrinks to Wi-Fi, HTTP, display, and sleep. Cost: a small always-on service and a second stale cause (server unreachable), handled by a device-side badge overlay described in `spec.md`.
- **Battery power, scheduled refresh.** Li-Po via the board's `BATT_ADC`. Refresh every 30 minutes from 5:00 AM through 10:00 PM local time (35 per day); no refreshes overnight. The 10:00 PM frame stays up until 5:00 AM, so its first two hourly marks are past by morning; accepted.
- **Weather data from the National Weather Service API.** Forecast, hourly forecast, and current observation from `api.weather.gov`. Civil dawn/dusk computed on the server from fixed coordinates. A condition-mapping table from NWS fields to the 30 icon semantics is a required deliverable.
- **Day/night boundary is civil dawn/dusk.** Day runs from civil dawn through civil dusk. This picks the icon variant for the current reading and each hourly mark, using the same twilight times the screen displays.
- **Hourly marks show that hour's forecast exactly.** The 3 PM row shows the NWS hourly values for 3 PM, not an aggregate of 3–5 PM.
- **Alert state removed.** See the edge-state list above.
- **Stale badge removed.** The footer timestamp is the staleness indicator. A failed fetch leaves the previous frame on the panel.
- **Daily row uses the NWS daytime period** for condition and precipitation chance.
- **Server hosting:** a scheduled job renders each frame shortly before the device wakes and writes it to static hosting; nothing stays running.
- **Wire format:** raw 15,000-byte 1-bit framebuffer; PNG published alongside for review.
- **Setup screen text is final:** `WeatherStation-Setup` and `192.168.4.1` as rendered.
- **Repo management:** the project stays in iCloud Drive; `git init` happens at the start of the development phase. Because iCloud can create `name 2.png` conflict copies in `assets/icons/`, run the default build (which clears the folder) before relying on that folder.
- **No screen for the gap before the first frame.** The setup screen stays on the panel until the first frame is downloaded. Decided 2026-09-25.
- **Setup hotspot has a simple password, shown on the setup screen:** `firstlight`, approved.
- **The device asks only for Wi-Fi.** Location, units, and schedule are fixed for Jeremy's closet and live in the renderer's configuration, not on the device.
- **Re-entering setup:** originally long-press USER (GPIO 45). **Superseded 2026-09-25:** GPIO 45 is not an RTC pin and cannot wake the ESP32-S3 from deep sleep, so Jeremy moved this to the **BOOT button (GPIO 0)**: press to wake and refresh, hold five seconds to clear credentials.
- **Six-slot `hourly` arrays moved to `fixtures/archive/sixhour-*.json`.** Canonical fixtures now carry only the selected four-mark data; `--all` merges the archived arrays back in for the historical six-hour renders.
- **Physical legibility verified** by Jeremy; no further check required.

Items handed to development planning were resolved on 2026-09-25; see below and `../docs/scope.md` §9.

## Development-planning decisions — 2026-09-25

Made by Jeremy in the planning session that produced `../docs/dev-plan.md`. These touch the rendering contract, so they are recorded here as well as in `scope.md`.

- **Low-battery glyph: two published frames, device chooses.** The earlier plan had the device send its voltage as a query parameter and the server draw the glyph. Static hosting cannot read a query parameter. The server now renders `frame.bin` and `frame-lowbat.bin` from the same data each slot; the device downloads the one matching its own voltage reading, with a hysteresis band in firmware. The frames remain pixel-exact renderer output; the device still draws nothing. `spec.md` "Low battery" updated.
- **Pinned render environment, one-time re-baseline allowed.** The exports were produced with Node 16 and `sharp` 0.32 on Jeremy's Mac. Other machines carry different librsvg, fontconfig, and freetype builds, which can move glyph edges by a pixel. The renderer therefore runs in a container image with every rendering dependency pinned. If the container cannot reproduce the current exports byte for byte, the exports are regenerated from the container once and Jeremy re-approves them; from then on the container output is the reference. `spec.md` "Rendering contract" updated.
- **Hosting: GitHub Actions cron plus GitHub Pages** at a `builtbyjer.com` subdomain, public repository. Runs every 30 minutes; the job exits outside 5 AM–10 PM `America/Denver` and skips publishing on a failed fetch so the previous frame stays live.
- **Wake scheduling: device-side.** NTP on each wake, next slot computed locally with a fixed `America/Denver` TZ rule. No server-provided wake hint.
- **Repository: public monorepo `jeremyward37/weather-epaper`**, cloned to `~/codeProjects/weather-epaper` outside iCloud Drive. The iCloud folder is frozen with a pointer to the repository.
- **Firmware: PlatformIO, Arduino framework, GxEPD2.** BOOT (GPIO 0) is the only user button; see the setup note above.
- **Repository is public.** Jeremy may switch it later; a private repo meters Actions minutes and needs GitHub Pro for Pages.
- **Execution convention:** one Codex session per task; tasks live in Jeremy's Notion *Dev Tasks* database and are listed in `../docs/dev-plan.md`; every session appends an entry to `WORKLOG.md`.

## T03 renderer feedback — 2026-09-26

Jeremy approved the complete seven-frame pinned-container re-baseline and these adjustments on 2026-09-26. The exports in `exports/normal/` and `exports/states/` are now the canonical container output.

- The normal/low-battery footer logo remains at its approved bottom-right anchor. Difference-bounded review crops had hidden unchanged footer pixels, so the revised 3× review images show each complete frame. The setup screen keeps its approved large centered logo and no footer, as Jeremy clarified.
- Enable Raleway lining numerals in the pinned font configuration so the digits in `108°`, `48°`, and `61°` have aligned cap heights rather than oldstyle ascenders/descenders.
- Move the `FIRST LIGHT` / `LAST LIGHT` label's visible center from y=31 to y=38. Right-anchor the event time at x=370 so the current fixtures all leave 32 px of visible right margin.
- The pinned renderer produces a 5 px minimum hourly gap in the width fixture. Jeremy explicitly accepted it with the re-baseline; `spec.md` and `verify.py` were updated together from the former 7 px minimum. The separate percentage-to-divider clearance remains at least 7 px.
- **Exports re-baselined from the pinned container on 2026-09-26; approved by Jeremy.** All seven frames are byte-for-byte reproducible with `./tools/render.sh`.

## T07 NWS mapping decisions — 2026-09-26

The mapping table and rules are in [`../docs/nws-condition-map.md`](../docs/nws-condition-map.md). They select among the approved icons and do not alter a frame, anchor, or bitmap.

- For a dual twelve-hour NWS icon, select the six-hour half with higher icon-embedded precipitation chance; on a tie select the second half, which represents the later part of the daytime period. The period's own chance remains the displayed value.
- Use the caller's civil dawn/dusk `isDay` for the icon variant, even if the NWS icon URL says day or night.
- When a period reports positive precipitation chance with a neutral condition icon, promote it to an icon carrying the forecast's precipitation type. With no type wording, use snow at 34 °F or colder and showers above 34 °F. This preserves the approved positive-chance icon rule.
- `hailDay` and `hailNight` remain for a zero-chance hail condition; with positive chance, use the thunder icon because the approved validator permits only Rain, Snow, Mix, or Thunder names alongside a percentage.

## T11 render-job decisions — 2026-09-27

- Fixture mode uses the fixture's `lowBattery` value so `normal-night.json` reproduces its approved export; live mode renders the same weather data twice with the overlay explicitly off and on.
- The in-memory 1-bit renderer output has the approved pixels but a different PNG encoding. Re-saving it with the pinned Pillow version reproduces the approved export bytes without changing a pixel or the frame design.
- The footer shows the instant of the successful render from fresh NWS data. Bundle metadata also records the NWS hourly forecast's `updateTime` so source freshness is visible without changing the frame.

## T12 scheduled-publish decisions — 2026-09-27

- Jeremy approved a 4:47 AM local-time publish in addition to the T12 card's :17/:47 schedule from 5 AM through 9 PM. This supplies the 5:00 AM device wake and brings the job to 35 daily runs, matching the 35 wake slots. The earlier UTC-aligned :20/:50 plan in `docs/scope.md` §9 is superseded.
- Scheduled runs that start shortly after 10 PM may still publish the final frame. Manual runs outside 5 AM–10 PM skip publication. A failed render never uploads a Pages artifact, preserving the previous deployment.

## Orchestrator handoff — 2026-10-07

Jeremy requested that remaining development use an orchestrator with implementation subagents, independent testing/QA, and pauses for his review. `docs/orchestration.md` defines roles and review gates; `docs/orchestration-state.md` records the current gate and approvals. One card per implementation run remains; the persistent orchestrator may coordinate later runs only after applicable approval. Only the primary agent updates Notion/log/Git. Software checks cannot substitute for physical evidence, and merge/deploy/advancement need explicit authorization for the reviewed revision.

Notion reconciliation: T01–T13 and T22 Done, T14–T21 Not started. Board delivered 2026-10-06, unopened; shipping completion is not hardware acceptance. T23 prepares the handoff. T17 now depends on T16 for integrated power measurements; T18 depends on T17 for calibrated battery behavior; final T20 depends on T19 for measured battery life. T21's known scheduler delays/missing slots require evidence and an explicit implementation/not-needed/deferral decision before T18 sign-off. Approved frames, scope, and rendering checks are unchanged. Corrected older scope prose to match the existing device-local NTP/TZ scheduling and local battery diagnostics without adding telemetry.


## T14 USB bring-up preparation — 2026-10-07

Jeremy confirmed the board is unboxed, a USB data cable is ready, and no battery was supplied. His pack is expected in early November 2026; he intends continuous USB power until then. T14 uses a documented no-pack ADC reading, as its existing criteria permit. Battery threshold calibration and life testing remain gated by the actual pack. The wire-format default remains row-major, 50 bytes per row, 15,000 bytes total, MSB first, 1 = white. The initial preparation record awaited physical evidence; the following entry records the actual T14 setup photo. No approved frame or scope of display behavior changes.

## T14 physical wire-format evidence — 2026-10-07

Jeremy flashed the frozen app `197954ed939d99b47ab43c8115749adb3fe8078ff43f5075bb58c5717018589d` from implementation `4ac387d` and supplied IMG_2842.JPG, preserved unchanged as `firmware/photos/t14-setup.jpg`. Actual-panel visual comparison by the orchestrator and independent QA passed: upright/unmirrored logo and text, black on white, complete content, no visible crop, shift or missing columns. The default raw 15,000-byte/50-byte-row/MSB-first/1=white format is confirmed for this panel without a polarity or bit-order correction. Separate software checks established zero differing pixels; the angled physical photo is visual evidence, not a pixel-level measurement. No export or server format was changed. Runtime reports 16 MB flash, 8 MB PSRAM and zero ADC readings with USB-only/no battery pack. T14 stays In progress pending button transitions and Jeremy's explicit acceptance/merge authorization; this observation does not authorize the next card.

At 13:00 MDT Jeremy supplied both USER and BOOT HIGH→LOW→HIGH transitions with increasing timestamps and continued zero no-pack readings, preserved in `firmware/logs/t14-buttons.txt`. Independent QA passed these final physical checks. The remaining T14 gates are Jeremy's explicit acceptance and authorized merge with green current-head CI; T15 advancement remains separately gated.

## T14 acceptance and T15 provisioning preparation — 2026-10-07

Jeremy explicitly accepted T14, authorized PR #19 merge and T15 start. Final accepted head `6b39baa` passed both required CI jobs; squash `08be1ac` is the T15 base. T14 is Done. T15 uses GPT-6.1 Sol · Medium implementation and separate GPT-6.1 Sol · High QA, checked available in this runtime. Its own hardware release and acceptance remain pending.

T15 pins tzapu/WiFiManager 2.0.17 and preserves the approved SSID `WeatherStation-Setup`, public password `firstlight`, address `192.168.4.1` and byte-identical setup bitmap. The blocking API processes a nonblocking portal internally to sample BOOT during setup/reconnect. No portal timeout applies while unprovisioned. Native Wi-Fi NVS stores credentials; Preferences stores provisioning/frame metadata and reset intent so an interrupted reset does not intentionally revive the previous config. Network debug logging is disabled. Five-second runtime BOOT hold requests reset; USER is unused. Short BOOT release invokes the future T16 refresh hook. Independent five-millisecond ESP timer sampling latches a five-second hold during the pinned library's bounded form-save work; the main thread applies the event after that work returns. A continued hold fires once until release.

Setup is drawn only when entering provisioning, after checked removal of the prior frame hash; storage failure retries with BOOT handling active rather than replacing the panel while leaving a stale identity. Saved-credential boots retain the panel. No visual state, location/units/schedule input, weather fetch or scheduled sleep is added. A separate bounded ten-second timer-sleep test environment supports Jeremy's real persistence check; its binary must be reviewed independently and the normal firmware restored afterward. Mocks/builds cannot mark radio or physical NVS persistence passed.


## T24 daily low/high display correction — 2026-10-07

Jeremy requested T24 now and authorized changing only the three daily temperature pairs from `H°/L°` to `L°/H°` on normal and low-battery frames. The fields retain their NWS meaning: high from the daytime period, low from the following night; day labels, dates, condition and chance still use the same periods. No sorting or normalization change. Preserve Lato Regular 20 px, x=303, centers y=126/178/230, slash without spaces, signed whole values, and every other pixel. Setup remains byte-identical. The pinned pipeline generates the references and 3× previews; concrete re-baseline acceptance, independent QA, merge and deployment gates remain pending.


## Publishing reliability follow-up — 2026-10-09 (T21)

- Jeremy requested a repeat reliability check after an approximately 08:00 reset retrieved the previous evening's frame. The complete Oct 2–8 week showed only 36 scheduled runs and 29 real scheduled deployments against 245 expected opportunities. Only 25 wakes had a new scheduled deployment in the prior half-hour. Successful no-ops were excluded; missing arrival buckets were measured separately from timing of observed runs.
- Jeremy selected **Google Cloud Scheduler** in this chat: two HTTP jobs fit the ongoing free allowance if unused, with a billing account required. Proposed schedules remain 04:47 then :17/:47 from 05–21, America/Denver. Retain the pinned renderer, Pages URL and existing GitHub cron fallback. Detailed evidence, tradeoffs and activation steps: `docs/t21-reliability.md`.
- Prepare external dispatches for 04:47–04:59; the old guard would skip the first-wake job. No frame/layout, firmware or DNS change. External jobs are not active yet; credentials, reviewed merge and seven days of actual post-change evidence remain required. This choice does not claim that the new end-to-end path has been proven reliable.
