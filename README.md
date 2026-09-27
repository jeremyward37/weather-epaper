# ePaper Weather Station

A 4.2″ black-and-white e-paper display (RockBase NM-EPD-420-BW, 400 × 300 px, 1-bit) that hangs in a closet and shows the current temperature, the next four 3-hour forecast marks, the next three days, the next civil dawn/dusk, and a slim footer. Location: Marriott-Slaterville, UT. Battery powered; refreshes every 30 minutes from 5 AM to 10 PM.

This repository holds the **approved design** (mockups, a pixel-exact handoff spec, and the pipeline that renders and verifies them) and, as development proceeds, the **server** and **firmware** that implement it. Architecture decided 2026-09-25: a **scheduled job renders the frame** with this same pipeline and publishes a raw 1-bit framebuffer to static hosting; the device only downloads and displays it. Weather data comes from the **National Weather Service API**. The development plan is [docs/dev-plan.md](docs/dev-plan.md); progress is logged in [WORKLOG.md](WORKLOG.md).

## Status (as of 2026-09-25)

- **Design approved.** Normal state at checkpoint 2 (concept E3, four fixed 3-hour marks, three days); setup and low-battery screens at checkpoint 3 on 2026-09-25. Physical legibility verified by Jeremy the same day.
- **Setup hotspot password `firstlight`** was added after the checkpoint 3 review and approved the same day. Nothing in the design is pending.
- **Severe weather alert and the `DATA STALE` badge: removed from scope** 2026-09-25. A failed fetch keeps the previous frame; the footer timestamp is the staleness signal. Renders are in `design/exports/archive/`.
- **No further design work is planned.** The gap before the first frame shows the setup screen; no extra state.
- Full scope, decisions, and open items: [docs/scope.md](docs/scope.md).
- **Development planned 2026-09-25.** Tasks are cards in Jeremy's Notion *Dev Tasks* database and are listed in order in `docs/dev-plan.md`. Build to `design/spec.md`, review with `design/review-instructions.md`.
- **Repository:** public GitHub monorepo [jeremyward37/weather-epaper](https://github.com/jeremyward37/weather-epaper), cloned to `~/codeProjects/weather-epaper`. The iCloud Drive folder is frozen; work in the canonical clone.
- Working convention: software is built with OpenAI Codex, one task per session; every session appends to `WORKLOG.md` and updates its Notion card.

## Read in this order

Later documents override earlier ones. When two disagree, the one higher in this list wins.

| # | File | What it is | Authority |
|---|---|---|---|
| 1 | [docs/scope.md](docs/scope.md) | **Project scope:** goal, hardware, architecture, data, states in/out, schedule, development-planning decisions | **Live. Source of truth for scope.** |
| 1b | [docs/dev-plan.md](docs/dev-plan.md) | **Development plan:** phases, ordered tasks with Notion links, model and token recommendations | **Live.** |
| 1c | [WORKLOG.md](WORKLOG.md) | Agent work log and the rules for writing it | Live |
| 2 | [design/spec.md](design/spec.md) | Pixel-exact design contract: region map, anchors, fonts, show/hide rules, state behavior | **Live. Source of truth for the frame.** |
| 3 | [design/decisions.md](design/decisions.md) | What was chosen and why, what was rejected, dated decision log | Live |
| 4 | [design/icon-map.md](design/icon-map.md) | Condition → icon file mapping, day/night, sizes | Live |
| 5 | [design/review-instructions.md](design/review-instructions.md) | Pass/fail protocol for reviewing the implementation against the exports | Live |
| 6 | [docs/scope-review.md](docs/scope-review.md) | Dated log of the 2026-09-25 scope review; `scope.md` supersedes it where they differ | Log |
| 7 | [docs/design-brief.md](docs/design-brief.md) | The original design brief. Several requirements (6 hourly slots, 5 days, section headings, footer location text, separate precip glyphs, centered logo, alert state) were **superseded** by Jeremy during design; `spec.md` lists the overrides. | Historical background |
| 8 | [docs/context.md](docs/context.md) | Jeremy's original notes that the brief was built from | Historical background |

The visual references are the 1-bit PNGs in `design/exports/normal/` and `design/exports/states/`. Open `design/index.html` in a browser to review them at physical size, 1×, and 3×.

## Folder map

```
README.md, AGENTS.md          start here
WORKLOG.md                    agent work log (rules + template + entries)
build.sh                      runs build → threshold → verify
docs/                         scope.md (live scope); dev-plan.md (task plan); scope-review.md (log); historical: design-brief.md, context.md, example-designs/
server/                       (T07+) render job: NWS fetch → normalize → render → pack → publish
firmware/                     (T14+) PlatformIO project for the ESP32-S3 board
tools/                        (T03+) framediff.py and other cross-cutting scripts
.github/workflows/            (T05+) CI and the scheduled publish job
design/
  build.js                    CLI for regenerating exports and the icon inventory
  lib/render.js               importable renderer, fixture validation, icon/ink cache, Node 1-bit PNG conversion
  test/                       node --test tests for fixtures, pixel identity, low-battery overlay
  threshold.py                converts raw renders to true 1-bit PNGs, writes 3x previews, routes to exports/
  verify.py                   mechanical gate: sizes, 1-bit, margins, alignment, gaps, review-page links
  package.json, requirements.txt
  spec.md, decisions.md, icon-map.md, review-instructions.md, index.html
  fixtures/                   JSON data behind each mockup (normal-*.json, setup.json)
  fixtures/archive/           historical concepts, six-hour arrays (sixhour-*.json), removed alert/stale states
  assets/source/              vendored masters: Weather Icons SVGs, refresh icon, logo snapshot; see SOURCES.md
  assets/fonts/               TTFs used by the renderer (Lato, Raleway, Montserrat, Roboto Mono)
  assets/icons/               pre-rasterized 1-bit icon bitmaps, {semanticName}-{size}.png
  exports/normal/             CANONICAL: normal-{summer,winter,spring,widths,night}.png
  exports/states/             CANONICAL: state-{setup,low-battery}.png
  exports/preview@3x/         nearest-neighbor 3x enlargements of the canonical frames, review only
  exports/archive/            historical: concepts A–E3, normal-6hour-*, logo-size alternates, audit sheet, removed alert and stale states
  .build/                     GENERATED, git-ignored: raw antialiased PNGs, generated SVGs, fonts.conf
```

## Build and verify

The canonical renderer is the pinned Linux container. It requires Docker and Git; the script builds the image when its locked inputs change, runs the frame-diff tests, regenerates the design, and compares all seven frames with the committed exports:

```bash
./tools/render.sh
```

It prints one row per canonical frame and exits successfully only when `design/verify.py` passes and every row has zero differing pixels. Jeremy approved the one-time container re-baseline on 2026-09-26; the comparison record is in [`docs/rebaseline-report.md`](docs/rebaseline-report.md).

The host build remains available for quick local iteration, but it is not the cross-machine reference. Its prerequisites, once, are:

```bash
cd design && npm install && cd ..
```

```bash
python3 -m venv design/.venv && design/.venv/bin/pip install -r design/requirements.txt
```

`build.sh` uses `design/.venv` automatically when it exists; otherwise it falls back to the system `python3`, which then needs Pillow installed some other way.

Server code can import the CommonJS renderer directly. `lowBattery` overrides the legacy fixture field so both variants can be rendered from one data object:

```js
const {renderNormal, renderSetup, validateNormal, toOneBitPng} = require('./design/lib/render.js');
validateNormal(fixture);
const raw = await renderNormal(fixture, {lowBattery: false}); // 400 × 300 antialiased PNG Buffer
const png = await toOneBitPng(raw); // 1-bit grayscale PNG Buffer, white when luminance >= 160
```

`renderSetup(setupFixture)` has the same raw-PNG return type. The library caches rasterized icons and ink measurements in process; the CLI writes the generated SVGs, raw PNGs, and icon inventory. Run `node --test design/test` inside the pinned renderer image to verify the library against all seven exports.

Then, from the project root:

```bash
./build.sh
```

That runs `node design/build.js`, `python3 design/threshold.py`, and `python3 design/verify.py` in order. `verify.py` must print `PASS`. Add `--all` to also regenerate the historical renders in `design/exports/archive/`; the default build only produces the seven canonical frames. The archived alert and stale renders are not regenerated by any build.

`sharp` is pinned to 0.32.x because the local Node is v16. On Node 18+ a newer `sharp` also works.

## External dependencies

None at build time. Every icon, the refresh artwork, and a snapshot of the Sovereign Aperture logo are vendored in `design/assets/source/`. That folder's `SOURCES.md` records where each master lives and its license. The logo master is in the sibling `personal-logo` project; if it changes upstream, copy it in deliberately and re-review the footer and setup exports.

## Things that trip up new agents

- **`design/.build/svg/` is generated.** Every SVG there is rewritten by `build.js` on each run. To change a mockup, edit `design/lib/render.js` or a fixture, then rebuild.
- **Canonical fixtures carry `threeHourly` (four 3-hour marks) only.** The legacy six-slot arrays live in `design/fixtures/archive/sixhour-*.json` and are merged in only by `--all` for the archived six-hour renders.
- **`design/exports/archive/` is not the target.** It exists so earlier options can be compared; the review instructions say to reject a six-hour or five-day implementation.
- **`design/assets/icons/` is regenerated on each build.** Never hand-edit it. The default build contains exactly the 96 bitmaps listed in `icon-map.md`; `--all` adds historical concept samples and precipitation-type glyphs.
- **Do not weaken `verify.py` to get a green result.** If a check fails after an accepted design change, update `spec.md` and the check together.
- **The design is approved.** Do not change a frame without Jeremy's sign-off. `docs/design-brief.md` §9's checkpoints are all closed.
- **There is no alert state and no stale badge.** Older documents and archived renders show them; both were removed on 2026-09-25.
- **iCloud can drop `name 2.png` conflict copies into `design/assets/icons/`.** The default build clears that folder, and `verify.py` rejects extras, so just rebuild. Git lives in `~/codeProjects/weather-epaper`, never in the iCloud folder.
- **Frames must match `design/exports/` byte for byte.** Rendering happens in a pinned container so every machine agrees. Do not "fix" a one-pixel difference by editing the export; find the environment difference.
- **Rendering is server-side.** Do not plan Adafruit-GFX font conversion or on-device layout; the device displays a downloaded frame.

## Hardware

- Product page: https://rockbase.shop/en/products/nm-epd-420?variant=42529919762514
- Documentation: https://wiki.rockbaseiot.com/docs/products/nm-epd-420/
- Panel firmware reference: https://github.com/RockBase-iot/NM-EPD-420
- Icon and font source: https://github.com/RockBase-iot/esp32-weather-epd
