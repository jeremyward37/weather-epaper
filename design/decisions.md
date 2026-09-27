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
- Daily: three rows with visible centers y=126, 178, and 230. Day at x=218 / Lato Regular 18 px, condition icon at x=260 / 36 px, high/low at x=303 / Lato Regular 20 px. The chance percentage, when present, is a separate subordinate line at x=303, visible center 20 px below the main row, in Lato Regular 16 px. High/low uses `/` throughout.
- Footer: refresh bitmap 14 px at x=7, Lato Regular 14 px last-update text at x=27, optional 14 px low-battery glyph at x=136, and 20 px Sovereign Aperture logo right-aligned to the content edge at x=375. Each element’s visible ink is centered around y=285.5; there is no location text.

The renderer measures the visible black pixels of each text string and rasterized icon, then computes its placement from the desired center line. In the final 1-bit PNGs, the measured centers of current icon/temperature, sun icon/time, each hourly row, each daily main row, and footer items agree within 0.5 px. Fixed column anchors avoid horizontal jitter as values and precipitation vary. The synthetic width fixture fits `108°`, `100%`, `-12°/-24°`, and `12/31 12:58 PM` without collision; the closest forecast gap to the divider is 7 px.

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
