> **Status: historical background.** Moved to `docs/` on 2026-09-25. This brief drove the design phase, but Jeremy superseded several of its requirements during design (four 3-hour marks instead of six hours, three days instead of five, no headings, no footer location, no separate precipitation glyphs, logo at footer right). Where it conflicts with `design/spec.md` or `design/decisions.md`, those win. Paths below are relative to the project root as it was on 2026-09-24: `example-designs/` is now `docs/example-designs/`, and the refresh icon and logo masters are vendored in `design/assets/source/`. Start at `README.md`.

# Design Brief — ePaper Weather Station

**For:** Design agent (OpenAI Codex)
**Owner / reviewer:** Jeremy
**Prepared:** 2026-09-24
**Scope:** Visual design and handoff spec only. No firmware, no API integration, no enclosure work.

This brief is the source of truth for the design phase. It is built on `context.md` and resolves that file's open questions. Where the two conflict, **this brief wins**. The overrides are listed in §11.

---

## 1. What we're designing

A single-glance weather display that hangs in Jeremy's closet so he knows what the day's weather will be while he gets dressed. Priority order: **current temperature first**, then the next 6 hours, then the next 5 days. Viewing distance is **arm's length**.

Location: **Marriott-Slaterville, UT**. All temperatures are in **°F**.

---

## 2. Inputs (read these first)

All paths are relative to the project root (`weather-epaper/`).

| Input | Path | Notes |
|---|---|---|
| Original context | `context.md` | Background only. This brief overrides it. |
| Example designs | `example-designs/` | Inspiration only, see §6.1 |
| Refresh icon (for footer) | `assets/refresh-icon.png` | 512×512, black, rounded-stroke clockwise arrow |
| Logo (primary) | `../personal-logo/final/svg/sovereign-aperture-black.svg` | "Sovereign Aperture" emblem, a heavy arch plus a centered diamond |
| Logo usage rules | `../personal-logo/final/README.md` | Clear space, minimum size, do/don't |
| Icon + font source | https://github.com/RockBase-iot/esp32-weather-epd, `icons/svg/` and `fonts/` | Reuse the icons. See §6.3 |
| Hardware docs | https://wiki.rockbaseiot.com/docs/products/nm-epd-420/ | Reference only |

---

## 3. Hard hardware constraints (non-negotiable)

| Constraint | Value | Design implication |
|---|---|---|
| Panel | RockBase NM-EPD-420-**BW** (GYE042A87), 4.2″ | — |
| Canvas | **400 × 300 px, landscape** | Every mockup is exactly this size |
| Color depth | **1-bit: pure black and pure white only** | No grays, no anti-aliasing, no gradients, no dither fills. Several examples use gray. Do not copy that. |
| Pixel density | ~120 ppi (1 px ≈ 0.21 mm) | Text under ~11 px tall is hard to read at arm's length |
| Rendering on device | ESP32-S3 drawing at runtime with GxEPD2 + Adafruit-GFX | The design must be reproducible from: **bitmap icons**, **Adafruit-GFX bitmap fonts** (no kerning, no hinting), lines, rects, rounded rects, circles, and 1-px dotted lines. No arbitrary vector paths at runtime. The logo and icons ship as pre-rasterized bitmaps. |
| Stroke weight | ≥ 2 px for icon strokes and important lines | 1-px strokes look faint on e-paper. Use them only for dividers. |
| Safe margin | Keep content ≥ 4 px from every edge | Enclosure and bezel are not decided yet |
| Refresh | Full refresh every 30 min (~2–3 s) | No animation. Design for a static frame. |

**Note:** the RockBase esp32-weather-epd port already includes a 4.2″ layout, but it targets the **tri-color** (black/white/red) panel. Do not use red. Do not assume that layout is the answer. It is a reference for density only.

---

## 4. Content specification — normal state

Show **only** the data below. Do not add wind, humidity, UV, AQI, pressure, visibility, moon phase, indoor temperature, a date header, or graphs. If you think an extra element earns its place, present it as a clearly labeled **optional variant**, never in the primary design.

### 4.1 Current conditions (dominant element)
- **Temperature**, °F, whole number with a degree sign, e.g. `72°`. This is the largest element on the screen.
- **Condition icon**, with **day and night variants** (e.g. clear-day sun vs. clear-night moon).
- Must handle `-12°` through `108°` (1–3 characters plus a minus sign) without the layout shifting.

### 4.2 Hourly forecast — next 6 hours
- 6 slots, **starting at the next full hour** (at 4:58 PM the slots are 5 PM through 10 PM).
- Each slot:
  - Time label: `5 PM`, `10 PM`, `12 AM` (no leading zero, space before AM/PM)
  - Condition icon (day/night variant according to that hour)
  - **One temperature** for the hour, e.g. `68°`. No high/low per hour.
  - **Precip chance %** (e.g. `40%`), **shown only when > 0**
  - **Precip type icon**, **shown only when chance > 0**
- The row must stay visually aligned and balanced whether 0, some, or all slots show precipitation. Hidden precip must not make the row look broken or jumpy.

### 4.3 Daily forecast — next 5 days
- 5 slots, **starting tomorrow** (today is covered by 4.1 and 4.2).
- Each slot:
  - Day label: `Thu`
  - Condition icon (day variant)
  - **High / Low** °F, e.g. `84° / 59°`. Pick one separator and use it consistently.
  - **Precip chance %**, **shown only when > 0**
  - **Precip type icon**, **shown only when chance > 0**
- The same alignment rule as the hourly row applies.

### 4.4 Precipitation types (each needs a distinct small icon)
1. Rain (includes showers and drizzle)
2. Snow
3. Mix / sleet / freezing rain (one shared icon)
4. Thunderstorm

**Flag for the designer:** the condition icon (e.g. "rain cloud") and the precip-type icon can be redundant. Jeremy asked for both. Propose a treatment that keeps both without visual noise, for example a small type glyph paired with the % as one unit. Call it out in `decisions.md`.

### 4.5 Sun event — civil dawn / civil dusk
- Show **only the next event**: before dawn, show civil dawn; after dawn and before dusk, show civil dusk.
- These are **civil twilight** times, not sunrise/sunset. The label or icon must not read as plain "Sunrise/Sunset". Suggested wording: "First light" / "Last light", or a dawn/dusk icon with a horizon line. Propose and justify your choice.
- Time format: `H:MM AM/PM`, e.g. `6:41 AM`, `9:45 PM`.

### 4.6 Footer
A slim band across the bottom. It has three zones and they should feel quiet.

| Zone | Content | Format |
|---|---|---|
| **Left** | Refresh icon + last-update date/time | `[↻] 9/24 4:58 PM`: `m/d h:mm AM/PM`, no leading zeros, space before AM/PM. Use `assets/refresh-icon.png`. |
| **Center** | Jeremy's logo (Sovereign Aperture, black) | Horizontally centered on the canvas, not just centered within leftover space |
| **Right** | Location | `Marriott-Slaterville, UT` (right-aligned) |

- Worst-case widths to test: left `12/31 12:58 PM`, right `Marriott-Slaterville, UT` (24 characters, which is long).
- **Logo size is your call.** The brand guide says 24 px minimum, with 16 px permitted for favicons. Render the logo at ~18 px and at 24 px as hand-checked 1-bit bitmaps, compare them in context, pick one, and record the reasoning in `decisions.md`. Rules from the logo README: no stretching, outlining, rotating, or effects. Keep clear space of at least one diamond-width on all sides. Keep the arch/diamond relationship intact.
- The low-battery glyph lives in the footer too (see §5.4). Reserve space for it without disturbing the three zones.

---

## 5. States to design

Each state gets its own mockup and PNG export.

| # | State | Requirements |
|---|---|---|
| 5.1 | **Normal** | §4 with realistic data. Deliver several data variants (see §7). |
| 5.2 | **Stale data / fetch failed** | Shown when the last successful update is > 90 min old (3 missed refreshes). Keep the last good data on screen, keep the footer timestamp as the *last good* time, and add a clear but calm "offline/stale" indicator. The indicator must be noticeable at arm's length without looking like an emergency. Suggested source: Phosphor warning / wifi-off icon from the esp32-weather-epd set. |
| 5.3 | **Wi-Fi setup / first boot** | A full-screen instructional screen shown before the device is configured. Include the logo (larger here is fine), a short title, and 2–4 numbered steps with placeholder values: network name `WeatherStation-Setup`, address `192.168.4.1`. An optional QR code area is allowed; if used, it must be a real scannable 1-bit QR at ≥ 2 px per module. |
| 5.4 | **Low battery (overlay on normal)** | No battery UI normally. When battery is **below ~15%**, a small low-battery glyph appears in the footer (e.g. just right of the timestamp). Show it on one normal-state variant. |
| 5.5 | **Severe weather alert** | For NWS warnings (e.g. `Winter Storm Warning`, `High Wind Warning`, `Excessive Heat Warning`). A banner or strip that shows the event name and an "until" time, e.g. `Until Thu 6:00 AM`. The current temp must stay dominant. Specify exactly which element shrinks, moves, or hides to make room, and how long alert names truncate (longest realistic example: `Winter Weather Advisory` plus the until-time). |

---

## 6. Visual direction

### 6.1 Reference examples (`example-designs/`)
None of these are perfect. Take ideas, not layouts.

| File | Jeremy's take | Take from it | Avoid |
|---|---|---|---|
| `Hero Lineup.webp` (TRMNL, front-left device) | ★ **Closest** | Huge thin-weight current temp. Calm dotted dividers. Quiet footer with location right-aligned. Lots of breathing room. | Grays/tints (not possible here). Too many secondary stats. |
| `Assembled Demo Raleigh Front.jpg` (esp32-weather-epd, 7.5″) | ★ **Closest** | Big condition icon next to big temp. Clean 5-day row of day/icon/hi-lo. Thin, consistent icons. | It's 800×480, and your 400×300 has about 1/3 the pixels, so scale the *amount* of content, not just the size. No stat grid and no temp graph. |
| `E Ink Weather Display Design Ideas.webp` (Watchung) | Secondary | Clear list rhythm for hourly/daily. Thin outline icons. | Density; the status bar at the top |
| `E Ink Weather Display Ideas.jpg` (moon / Thursday) | Secondary | Strong contrast and confident black shapes | Heavy boxed panels; calendar/QR content |
| `E Ink Weather Display Cover Card.webp` (DIY Machines) | Low | Card rhythm of a forecast row | Color, gradients, the curve graph |
| `E Ink Weather Display Ideas.jpeg` (portrait frame) | Low | Simple hierarchy | Portrait orientation |

### 6.2 Tone
Clean, minimal, organized, calm, and quietly confident, matching the logo's brand brief (`../personal-logo/jeremy-ward-logo-discovery-brief.md`). Prefer whitespace and alignment over boxes and borders. Use thin dividers (1 px solid or dotted) sparingly.

### 6.3 Icons
- **Style:** thin outline, with strokes ≥ 2 px after rasterizing.
- **Source:** reuse the esp32-weather-epd icon set (`icons/svg/`). It is Weather Icons by Erik Flowers (OFL 1.1), plus Google (Apache 2.0) and Phosphor (MIT). Rasterize at the exact pixel sizes your layout needs, then hand-check each at 1-bit. Fix or replace any icon that collapses at small sizes, and note it.
- The large current-conditions icon and the small forecast icons must read as one family.
- Produce a complete **condition → icon map** covering day and night variants: clear, mostly clear, partly cloudy, mostly cloudy, overcast, fog/haze, wind, rain, showers, drizzle, snow, flurries, mix/sleet/freezing rain, thunderstorm, hail, and smoke. List anything missing from the set.
- The refresh icon (`assets/refresh-icon.png`) and the logo must sit comfortably next to this icon family in the footer.

### 6.4 Typography
- Choose from fonts the esp32-weather-epd `fonts/` pipeline already supports (Adafruit-GFX `fontconvert`). OFL/Apache fonts are preferred: Lato, Montserrat, Open Sans, Poppins, Quicksand, Raleway, Roboto. Name the exact family, weight, and **pixel size** for every text role.
- Design with the font **rendered as a 1-bit bitmap**, not as smooth browser text, because thin weights break up at small sizes. A thin/light weight is fine for the huge current temp (TRMNL-style). Use regular or medium for anything under ~20 px.
- Suggested minimums: footer text ≥ 11 px cap-height-equivalent; forecast labels and temps ≥ 13 px.
- Use tabular (fixed-width) digits, or define alignment rules so that changing numbers don't jitter.

---

## 7. Stress-test data variants (normal state)

Render the normal layout with each of these data sets and make sure nothing collides, truncates badly, or shifts:

1. **Summer afternoon:** `97°`, clear-day. No precip anywhere. Next event: civil dusk `9:32 PM`.
2. **Winter morning:** `-4°`, snow. Precip in all 6 hours and all 5 days (mix of snow and mix types, `100%` values). Next event: civil dawn `7:21 AM`.
3. **Mixed spring day:** some slots with precip, some without, including a thunderstorm and a `5%` value. Hourly row crosses midnight (`10 PM`, `11 PM`, `12 AM`, `1 AM`…).
4. **Worst-case widths:** `108°` current, daily `108° / 88°` and `-12° / -24°`, footer `12/31 12:58 PM`.
5. **Night:** clear-night and partly-cloudy-night icons in the current block and the hourly row.

Store each data set as a small JSON fixture (§8) so the build agent can reproduce the exact screens later.

---

## 8. Deliverables

Create everything under `design/`:

```
design/
  src/                 # HTML/SVG mockups, one file per state; exact 400x300 viewport
  exports/             # 1-bit PNGs, exactly 400x300, one per state/variant
  exports/preview@3x/  # nearest-neighbor 3x enlargements for review only
  assets/              # 1-bit bitmaps: logo (chosen size), refresh icon, every icon at every size used
  fixtures/            # JSON sample data behind each mockup (§7)
  spec.md              # pixel-exact layout spec (see below)
  icon-map.md          # condition/precip-type -> icon file + size, day/night
  decisions.md         # choices made, alternatives considered, open questions for Jeremy
  index.html           # review page: every export side-by-side at 1x and 3x, plus a
                       # true-physical-size view (400px wide = ~85 mm on screen)
```

**`spec.md` must include:**
- A region map with `x, y, width, height` for every block (current, hourly, daily, sun event, footer zones, alert banner, stale indicator, battery glyph).
- For every text element: font family, weight, pixel size, alignment/anchor point, color (black/white), and truncation rule.
- For every icon slot: icon size in px and anchor point.
- Show/hide rules (precip %, precip-type icon, battery glyph, stale indicator, alert banner) and what happens to the layout when each is shown or hidden.
- Divider positions and styles.
- Formatting rules for every value (temps, times, dates, percentages).

**Export requirements:**
- Generate PNGs from the HTML/SVG, then **threshold to true 1-bit** (palette of exactly `#000000` and `#FFFFFF`). Verify with a script that no other colors exist.
- Inspect the 1-bit output rather than the anti-aliased browser render. The 1-bit output is what the panel will show.

---

## 9. Work plan and model recommendations (Codex)

Current Codex models (as of 2026-09-24): **GPT-6 Astra** (`gpt-6-astra`, most capable), **GPT-6 Sol** (`gpt-6-sol`, complex coding/agentic work, best balance), **GPT-6 Luna** (`gpt-6-luna`, fast/cheap, focused repetitive work). GPT-5.5 retires 2026-10-14, so don't use it.

| Phase | Task | Model / reasoning | Why | Output |
|---|---|---|---|---|
| 0 | **Asset audit:** clone esp32-weather-epd, inventory `icons/svg` and `fonts/`, rasterize a sample of icons and fonts at candidate sizes in 1-bit, flag what breaks | **Sol · Medium** | Needs judgment about 1-bit legibility, but the scope is narrow | Draft `icon-map.md`, font shortlist in `decisions.md` |
| 1 | **Export pipeline:** script HTML/SVG → PNG → 1-bit threshold → 3x preview, plus a color-check script and `index.html` review page | **Luna · Medium** | Mechanical tooling | Working `design/` scaffolding |
| 2 | **Layout concepts:** 3 distinct low-fi layouts of the normal state (wireframe-level, with real text and icons at 1-bit), each with a short rationale | **Astra · High** | The one step where layout judgment matters most; worth the cost | 3 concept PNGs in `exports/concepts/` |
| ⏸ | **Checkpoint 1: Jeremy picks a concept** (and requests changes) | — | — | Decision recorded in `decisions.md` |
| 3 | **High-fidelity normal state:** refine the chosen concept, finalize fonts and icon sizes, and render all §7 variants | **Sol · High** | Sustained iteration and polish | Normal-state exports + fixtures |
| 4 | **Footer + logo:** render the logo at ~18 px and at 24 px, hand-tune 1-bit pixels, finalize the footer, and test worst-case widths | **Sol · High** | Small-pixel precision on a brand asset | Footer assets + logo decision |
| ⏸ | **Checkpoint 2: Jeremy reviews the normal state at physical size** | — | — | Approved normal state |
| 5 | **Edge states:** stale, Wi-Fi setup, low battery, severe alert | **Sol · Medium** | Applies the established system to new states | State exports |
| 6 | **Handoff spec:** write `spec.md` and finalize `icon-map.md` and `decisions.md` | **Sol · High** | Precision matters because the build agent implements from this | Complete spec |
| 7 | **Self-QA:** run the §10 checklist, verify 1-bit exports, and cross-check the spec against the mockups (measure coordinates in the PNGs) | **Luna · Medium** | Checklist verification | QA notes appended to `decisions.md` |
| ⏸ | **Checkpoint 3: final sign-off** | — | — | Design complete |

Stop at each ⏸ checkpoint and wait for Jeremy. Do not continue past a checkpoint on your own.

---

## 10. Acceptance checklist

- [ ] Every export is exactly 400×300 and contains only `#000000` and `#FFFFFF`.
- [ ] The current temperature is clearly the dominant element in every state, including the alert state.
- [ ] The hourly row starts at the next full hour, has 6 slots, and shows one temp per slot.
- [ ] The daily row starts tomorrow and has 5 slots with high/low.
- [ ] Precip % and type icon appear only when > 0, and rows stay aligned in all §7 variants.
- [ ] All 4 precip types have distinct, legible icons at their rendered size.
- [ ] Day and night condition icons are both covered.
- [ ] The sun event shows only the next civil dawn/dusk, labeled so it isn't mistaken for sunrise/sunset. Format is `H:MM AM/PM`.
- [ ] The footer has the refresh icon + `m/d h:mm AM/PM` on the left, the logo centered on the canvas, and `Marriott-Slaterville, UT` on the right, with no collisions at worst-case widths.
- [ ] The logo follows its usage rules and the size decision is documented.
- [ ] The low-battery glyph fits without disturbing the footer.
- [ ] Stale, Wi-Fi setup, and severe alert states are all designed.
- [ ] Every element's coordinates, font, and size in `spec.md` match the exports.
- [ ] All fonts and icons are from the esp32-weather-epd pipeline (or documented replacements), with licenses noted.
- [ ] Nothing depends on gray, anti-aliasing, or runtime vector drawing.

---

## 11. Decisions already made (overrides to `context.md`)

| Topic | Decision |
|---|---|
| Orientation | Landscape, 400×300 |
| Hourly temperature | One temp per hour (not high/low) |
| Hourly start | Next full hour |
| Daily start | Tomorrow |
| Sun event | Next **civil dawn or civil dusk** only |
| Precip types | Rain, snow, mix/sleet/freezing, thunderstorm |
| Refresh cadence | Every 30 minutes |
| Power | Li-Po battery. Battery glyph only when low (< ~15%). |
| Footer timestamp | `[refresh icon] m/d h:mm AM/PM`, e.g. `↻ 9/24 4:58 PM` (replaces the "As of:" format) |
| Icon style | Thin outline, reusing the esp32-weather-epd icon set |
| Layout | Custom (not the port's stock 4.2″ layout) |
| Indoor sensor | Not displayed |
| Extra states | Stale/failed, Wi-Fi setup, severe alert, low-battery overlay |
| Logo size | Designer decides (~18 px vs 24 px) and documents why |

---

## 12. Out of scope

Firmware, weather API choice, data fetching, twilight calculation, alert sourcing, deep-sleep/power logic, enclosure design, and flashing hardware. The design must be **data-source-agnostic**: fixtures describe values (temp, condition, precip chance/type, times), not any specific API's response format.
