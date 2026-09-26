# Weather display implementation spec

**Status:** **Design approved.** Checkpoint 3 closed 2026-09-25: Jeremy approved the setup and low-battery screens, which with the checkpoint 2 normal state completes the design. The setup screen's `Password: firstlight` line was added after that review and approved by Jeremy the same day. Updated 2026-09-25 for the scope decisions recorded in `../docs/scope.md` and `decisions.md`. The canonical reference is the set of 400 × 300, 1-bit PNGs in `exports/normal/normal-{summer,winter,spring,widths,night}.png` and `exports/states/state-{setup,low-battery}.png`. The source generator is `build.js`. Jeremy approved the four fixed three-hour mark normal layout, including the final 5 px leftward adjustment of the hourly icons, and verified physical legibility of the exports on 2026-09-25.

## Rendering contract

Project scope, architecture, data source, and schedule live in `../docs/scope.md`. This file defines only what the frame looks like. The points below are the parts of that scope the renderer must honor.

- Frames are rendered on a server with the same pipeline that produces these exports (`build.js` layout → rasterize → threshold) and must be pixel-identical to the export for the same data. The fixtures in `fixtures/` are the renderer's test vectors. The device draws nothing of its own.
- **Reference environment (decided 2026-09-25):** the renderer runs in a pinned container image so every machine produces identical bytes. If that image cannot reproduce the current exports exactly, the exports are re-baselined from it once, with Jeremy's explicit re-approval; after that the container output is the reference and any drift is a defect.
- Panel: 400 × 300 px landscape, pure black `#000000` on pure white `#FFFFFF`. No gray, antialiasing, or animation.
- Canvas coordinates use origin `(0,0)` at the upper left. Content pixels remain at least 4 px from every edge. Solid rules are inset 5 px (`x=5..395`); dotted dividers are inset 6 px (`x=6..394`). Both are intentional.
- Fonts in use are Lato Regular and Raleway Regular only (`assets/fonts/`). Montserrat and Roboto Mono are vendored for the archived audit sheet and are not needed by the renderer.
- Draw values into fixed slots. A missing precipitation chance leaves its slot blank; it never moves adjacent fields.
- `../docs/design-brief.md` was superseded by Jeremy's approved changes: four future three-hour marks, three days, no section headings, no location, no separate precipitation-type glyphs, logo at the footer right, no severe-weather alert state, no stale badge.

## Normal-state region map

| Region | Bounds `(x,y,w,h)` | Contents |
|---|---:|---|
| Current | `(8,8,236,84)` | Condition icon and dominant temperature |
| Next civil event | `(255,20,140,68)` | First/Last Light label, horizon icon, event time |
| Hourly forecast | `(8,102,195,162)` | Four fixed 3-hour marks, one line each |
| Daily forecast | `(218,102,177,162)` | Three days starting tomorrow |
| Footer | `(5,272,390,24)` | Rule, refresh/timestamp, optional battery glyph, right logo |

The normal top divider is a 1 px dotted black line from `(6,94)` to `(394,94)` with the mockup's 1-on/3-off rhythm. The forecast divider is a 1 px dotted black line from `(209,102)` to `(209,263)`. There are **no row separators**. The footer rule is a 1 px solid black line from `(5,272)` to `(395,272)`.

## Normal-state anchors and sizes

All text is black, regular weight `400`, and left anchored unless another anchor is listed. Pixel size is the SVG font size used in the reference render, not the final cap height. `cy` is the **center of visible black pixels**, including icon strokes and glyphs, with ±0.5 px tolerance in the reference PNGs.

| Element | Font / bitmap | Anchor / target |
|---|---|---|
| Current condition | Weather Icons, 66 × 66 px bitmap | Left of box `x=10`; visible ink `cy=55` |
| Current temperature | Raleway Regular 76 px | Left `x=82`; visible ink `cy=55` |
| Sun label | Lato Regular 14 px, uppercase | Left `x=255`; visible ink `cy=31` |
| Sun event icon | Weather Icons, 30 × 30 px bitmap | Left of box `x=255`; visible ink `cy=64` |
| Sun event time | Lato Regular 22 px | Left `x=293`; visible ink `cy=64` |
| Hourly time | Lato Regular 18 px | Left `x=8`; row centers `121,161,201,241` |
| Hourly temperature | Lato Regular 22 px | Left `x=70`; same row centers |
| Hourly condition | Weather Icons, 32 × 32 px bitmap | Left of box `x=119`; same row centers |
| Hourly chance | Lato Regular 15 px | Left `x=164`; same row centers |
| Daily day | Lato Regular 18 px | Left `x=218`; main row centers `126,178,230` |
| Daily condition | Weather Icons, 36 × 36 px bitmap | Left of box `x=260`; same main row centers |
| Daily high/low | Lato Regular 20 px | Left `x=303`; same main row centers |
| Daily chance | Lato Regular 16 px | Left `x=303`; visible center `main row + 20` |
| Footer refresh | Supplied art, 14 × 14 px bitmap | Left of box `x=7`; visible ink `cy=285.5` |
| Footer last update | Lato Regular 14 px | Left `x=27`; visible ink `cy=285.5` |
| Low-battery glyph | 14 × 14 px bitmap | Left of box `x=136`; visible ink `cy=285.5` |
| Footer logo | Sovereign Aperture, 20 × 20 px bitmap | Box left `x=375` and right `x=395`; visible ink `cy=285.5` |

The minimum measured horizontal gap among hourly elements in the five approved fixtures is **7 px**. The synthetic width fixture also leaves at least 7 px between the final hourly percentage and the dotted divider. The logo is right justified to the 5 px content inset via its box; its actual black pixels have their own internal clear space.

## Content and formatting

- **Day/night rule (decided 2026-09-25):** an instant is *day* from civil dawn through civil dusk and *night* otherwise. This rule selects the day or night icon variant for the current observation and for each hourly mark. It uses the same civil twilight times shown in the sun-event area.
- **Current:** whole-number Fahrenheit; U+00B0 degree mark. Supported width is up to three digits plus an optional leading minus (the fixtures test `-12°` and `108°`; `-24°` is the same width as `-12°`). Current icon uses the day or night variant for the observation time per the day/night rule.
- **Hourly:** select the next four marks *strictly later* than local now from `{12 AM, 3 AM, 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM}`. At exactly 3:00 PM the first is 6 PM. Enumerate future real instants in the configured local time zone and retain those whose wall-clock hour is a three-hour mark; this skips a nonexistent clock hour during a daylight-saving jump and preserves chronological order. **Each mark shows the NWS hourly forecast values for that exact hour** (temperature, condition, precipitation chance for the 3 PM hour, not an aggregate over 3–6 PM). Choose the day/night icon variant for the mark's instant per the day/night rule. Format time `H AM/PM` with no leading zero; temperature is one signed whole number plus `°`.
- **Daily:** exactly three days beginning tomorrow in local date order; format day `Ddd`. Each day's condition icon and precipitation chance come from the NWS daytime period for that date; high is the daytime period's temperature and low is the following night period's (see `../docs/scope.md` §4). High/low is `H°/L°`, with no spaces around `/`, and signed whole numbers where needed.
- **Precipitation:** integer `0..100`. If zero, draw no percentage and no separate precip-type symbol. If positive, print `N%` at its fixed anchor and select a condition icon that visibly carries the appropriate rain, snow, mix, or thunder type. The condition icon mapping is in `icon-map.md`. Reject a generic cloud icon paired with a positive precipitation chance.
- **Sun event:** show only the next *civil dawn or civil dusk*. Before dawn show `FIRST LIGHT`; after dawn and before dusk show `LAST LIGHT`. Time is `H:MM AM/PM` with two minute digits. The horizon icon reinforces the event, but the text distinguishes it from sunrise/sunset.
- **Footer:** last *successful* update in `m/d h:mm AM/PM`; no leading zeros in month, day, or hour. No location text. Keep the refresh icon centered on the timestamp's visible ink center line.
- The normal-state fields have **no truncation** within their specified value bounds. Do not shrink fonts per row or reposition columns when digits, icon type, or chance changes. If incoming data exceeds the supported bounds, the server treats the fetch as failed and does not publish a new frame.

## State behavior and exact changes

### Fetch failed / stale data

There is **no stale indicator** (decided 2026-09-25; the outlined `DATA STALE` badge was removed). The footer's last-update timestamp is the only signal: it always shows the time of the last *successful* weather update, so an old timestamp tells the reader the data is old.

- **Server cannot get weather** (NWS down or invalid data): the server does not publish a new frame. The device downloads the previous frame, whose timestamp is unchanged.
- **Device cannot reach the server** (Wi-Fi or hosting outage): the device keeps the frame already on the panel. It may skip the redraw entirely, since e-paper holds the image without power and a redraw would only cost battery.
- Never print an attempted fetch time as a success. The timestamp changes only when a fresh frame was rendered from fresh weather data.
- With the 5:00 AM to 10:00 PM refresh schedule (`../docs/scope.md` §7), the 10:00 PM timestamp stays on the panel overnight by design.

### Wi-Fi setup / first boot

Setup takes over the full screen and shows no weather values or normal footer. The 64 × 64 px logo box starts at `x=168`, with visible ink centered around `y=53`. Title `SET UP WEATHER STATION` is Lato Regular 22 px, centered on `x=200`, visible `cy=111`. A 1 px solid rule runs from `(24,131)` to `(376,131)`. Step 1 `1. Connect to Wi-Fi` is Lato Regular 18 px at `x=35`, `cy=155`; network `WeatherStation-Setup` is Lato Regular 20 px at `x=59`, `cy=179`; `Password: firstlight` is Lato Regular 20 px at `x=59`, `cy=203`. Step 2 `2. Open this address` is Lato Regular 18 px at `x=35`, `cy=239`; address `192.168.4.1` is Lato Regular 20 px at `x=59`, `cy=263`. No QR code is used.

The network name, password, and address are final as rendered. `firstlight` meets the 8-character ESP32 hotspot minimum. If the password ever changes, anything longer than about 14 characters must be re-rendered and checked against the right margin. The setup screen stays on the panel until the first frame is downloaded (decided 2026-09-25; no separate "connecting" screen).

### Low battery

When battery level is **below approximately 15%**, draw the 14 px outline battery glyph at the fixed footer anchor. No battery UI appears normally. No other element moves. `state-low-battery.png` duplicates the night normal fixture with the glyph present.

The device is the only party that knows the battery voltage, and static hosting cannot read a request parameter. **Decided 2026-09-25:** the server renders **two frames from the same data every slot**, `frame.bin` (normal) and `frame-lowbat.bin` (identical except for the glyph), and publishes both. The device measures `BATT_ADC` on each wake and downloads whichever frame applies. The device never draws the glyph itself. The voltage threshold and a hysteresis band (so the glyph does not flicker between refreshes) are set in firmware once the battery pack is chosen; see `../docs/dev-plan.md`.

### Severe weather alert — removed

Jeremy removed the alert state from scope on 2026-09-25 (not useful enough for a closet display). Its renders are archived as `exports/archive/state-alert.png`, `state-alert-long.png`, and `state-combined-with-alert.png`; its fixtures are in `fixtures/archive/`. Do not implement it.

### Stale badge — removed

The outlined `DATA STALE` footer badge was removed on 2026-09-25; the footer timestamp is the staleness indicator (see *Fetch failed*). Renders are archived as `exports/archive/state-stale.png` and `state-combined.png`; fixtures are in `fixtures/archive/`. Do not implement it.

### Before the first frame

Between Wi-Fi provisioning and the first successfully downloaded frame there is nothing cached to show. Decided 2026-09-25: **no new frame.** The setup screen stays on the panel until the first frame lands. A device that cannot join Wi-Fi reopens the setup hotspot, so the setup screen remains accurate. A device that joins Wi-Fi but cannot download keeps showing the setup screen until a later scheduled attempt succeeds.

State precedence: setup is full screen until configured. On a configured device the only overlay is the low-battery glyph, which never changes forecast positions.

## Assets, reproducibility, and ownership

The default build clears `assets/icons/` and produces exactly 96 pre-rasterized 1-bit PNGs (kept as a complete icon inventory for review): all 30 condition semantics at 66 px (current), 32 px (hourly), and 36 px (daily); dawn and dusk at 30 px; refresh and lowBattery at 14 px; and logo at 20 px (footer) and 64 px (setup). Names follow `assets/icons/{semanticName}-{size}.png`; the complete file manifest and source mapping are in `icon-map.md`. `build.js` generates the raw bitmaps and `threshold.py` converts them to 1 bit. The four precipitation-type glyphs and concept-size samples are generated only with `--all` for historical exports and are not firmware assets. SVG sources, the refresh PNG, and the logo are vendored under `assets/source/` (provenance in `assets/source/SOURCES.md`); TTFs are under `assets/fonts/`. The logo master lives in the sibling `personal-logo` project, and the vendored copy is a deliberate snapshot. Preserve the logo's arch/diamond proportions and transparent clear space.

Build sequence: run `node design/build.js` with `sharp` available via `NODE_PATH` or the active Node environment, then run `python3 design/threshold.py` with Pillow available. The second step thresholds both exports and icon assets; do not deploy the intermediate raw PNGs from `.build/raw/`, and do not edit the generated SVGs in `.build/svg/` (edit `build.js` and `fixtures/` instead). Historical renders live in `exports/archive/` and are not the target. `index.html` presents physical-width, native, and 3× nearest-neighbor views. The verification protocol is in `review-instructions.md`.

Under server-side rendering the pre-rasterized icon bitmaps in `assets/icons/` are a by-product of the pipeline rather than a firmware deliverable; the server uses the same `build.js` code path that generates them. The device needs no bitmaps of its own.
