# Design review instructions for the implementation agent

Use this as a **pass/fail review protocol** for the weather display implementation. Rendering happens on a server (decided 2026-09-25): the server produces the 400 × 300 1-bit frame and the device displays it. Review the actual frame the server serves and the panel's display of it. `spec.md` defines coordinates and behavior; the selected `exports/normal/normal-*.png` and `exports/states/state-*.png` are the visual references. `index.html` groups the exports for human review. Everything under `exports/archive/` (concepts, `normal-6hour-*.png`, logo-size alternates, the audit sheet) is a historical comparison, not the target.

## 1. Establish the correct target

1. Read `spec.md`, `icon-map.md`, and `decisions.md` before changing server rendering or firmware code. Read `../docs/design-brief.md` for background, then apply the explicit user overrides listed in `spec.md`.
2. Confirm the implementation uses **four future three-hour marks** (12/3/6/9 AM/PM), **three days beginning tomorrow**, and the selected E3 divider pattern. Reject a six-hour or five-day implementation, even though those appear in older artifacts.
3. Confirm each hourly row is ordered **time → temperature → condition icon → chance**. The icon column begins at x=119, following Jeremy's last spacing correction. Daily rows are **day → condition icon → high/low**, with chance beneath high/low when positive.
4. Treat all seven exports as the approved design (checkpoint 3 closed 2026-09-25). There is no alert state and no stale badge; reject an implementation that adds either.

## 2. Rebuild the references and run the mechanical gate

From the project root, run the pinned container build, verifier, and seven-frame byte-for-byte comparison:

```sh
./tools/render.sh
```

The host build remains available for local iteration with Node, `sharp`, Python, and Pillow:

```sh
node design/build.js
python3 design/threshold.py
python3 design/verify.py
```

`./build.sh` from the project root runs the same three steps. Add `--all` to either form to also regenerate the historical renders under `exports/archive/`; the default build produces only the canonical normal and state frames. The default build also replaces `assets/icons/` with the exact 96-file inventory in `icon-map.md`; `verify.py` checks every listed icon and rejects extra files or sizes. With `--all`, the icon folder additionally contains historical concept samples and type glyphs.

If `sharp` is not in the active Node resolution path, provide its installed `node_modules` directory through `NODE_PATH`; do not alter source code just to fix module discovery. The commands must run in that order. `build.js` writes intermediate antialiased images and generated SVGs under `.build/` plus icon PNGs; `threshold.py` makes the final exports and icon assets 1-bit. Never use `.build/raw/` or a browser's smooth SVG display as a pass result.

`verify.py` must report PASS. It checks the five selected normal and two state exports, true 400 × 300 1-bit pixels, 4 px safe margins, pixel-center alignment, hourly gaps of at least 5 px, icon assets, and all review-page image links. If it fails, inspect and fix the cause; do not weaken a check merely to get a green result. The 5 px gap was explicitly approved with the 2026-09-26 container re-baseline and is documented in `spec.md`.

## 3. Inspect at three scales

For each selected image, inspect the **native 400 × 300 pixels first**, then the nearest-neighbor 3× preview to see individual pixels. Also inspect the approximate 85 mm physical-width view in `index.html` with a real ruler: CSS millimeters vary by monitor. A design that looks clean at 3× can still be illegible at arm's length.

Use the five normal fixtures in order:

| Fixture | Main risk to inspect |
|---|---|
| `normal-summer.png` | Calm hierarchy; zero-chance slots remain intentional blanks; hourly spacing looks even. |
| `normal-winter.png` | Negative temperatures, 100% in every row, snow/mix detail, daily second line. |
| `normal-spring.png` | Midnight wrap, day/night icons, 5% value, thunder/rain condition matches chance. |
| `normal-widths.png` | `108°`, `100°`, `-12°/-24°`, four 100% slots, and longest timestamp fit. |
| `normal-night.png` | Night icon family, low-battery glyph, footer centering. |

Then inspect `state-setup.png` and `state-low-battery.png`.

## 4. Compare placement against the approved normal screen

Check **visible black-pixel centers**, not SVG/image box centers or text baselines. On the selected normal screen:

- Current condition icon and current temperature share visible center `y=55`; neither looks lower. The temperature remains the largest element for `-12°`, `97°`, and `108°`.
- Sun icon and time share center `y=64`; the `FIRST LIGHT`/`LAST LIGHT` label is centered near `y=38`, and the time is right-anchored at x=370. The title, icon, and time use 14/30/22 px respectively.
- Hourly row centers are `121, 161, 201, 241`. Every time, temperature, icon, and positive percentage in a row shares its center within 1 px in the device output. Fixed left anchors are `8, 70, 119, 164`; minimum black-pixel gap is 5 px in the supplied fixtures. Do not push the icon back to x=124.
- Daily main-row centers are `126, 178, 230`. Day, icon, and high/low share each main center; the percentage is a deliberate secondary line 20 px below. An absent chance leaves the row's columns in exactly the same places.
- Refresh icon, timestamp, optional low-battery glyph, and right-side logo share the footer center near `y=285.5`. The right edge of the 20 px logo box is x=395. The logo must retain its original arch/diamond proportions and clear space.
- Only a dotted line at y=94 and a dotted vertical line at x=209 divide the normal data areas. The footer rule is solid at y=272. There are no period-by-period separators.

Pay special attention to the 5 px minimum hourly gap in the worst-case fixture. Preserve it when changing fonts, rasterization, or the incoming icon bitmaps. The server must use the same fonts and rasterizer as this pipeline, so glyph shapes should match exactly; any difference is a defect in the server's setup, not a tolerance to accept.

## 5. Verify data and icon meaning

- At 4:58 PM, the four marks are **6 PM, 9 PM, 12 AM, 3 AM**. At exactly 3:00 PM, the first is **6 PM**. Each mark shows the NWS hourly forecast for that exact hour. Test the midnight and month/year rollovers in local time, including daylight-saving transitions. Derive daily labels from local dates, not UTC dates.
- Day/night icon variants switch at civil dawn and civil dusk, the same times shown in the sun-event area.
- Show a whole-number Fahrenheit temperature and `°` in every current/hourly/high/low slot. Use one consistent `H°/L°` separator with no spaces. Format labels `H AM/PM`, sun time `H:MM AM/PM`, and footer `m/d h:mm AM/PM`.
- Show only the next **civil** dawn/dusk, explicitly labeled `FIRST LIGHT` or `LAST LIGHT`. Do not substitute sunrise/sunset times.
- Show a precipitation percentage only when it is above zero. Do not draw a separate precipitation-type glyph. A positive chance must use a condition icon with matching rain, snow, mix, or thunder features; use `icon-map.md` to check the mapping. Check day/night variants against the time of each hourly mark.
- Do not add a section heading, location, wind, humidity, AQI, date header, alert strip, or another unapproved data field.

## 6. Review state-specific behavior

| State | Required pass condition |
|---|---|
| Setup | Full-screen two-step instruction; larger logo; network `WeatherStation-Setup`, the hotspot password line, and address `192.168.4.1` exactly as rendered. No weather or footer content behind it. Stays on the panel until the first frame downloads. |
| Low battery | Below the agreed voltage threshold, show only the small footer battery glyph. No forecast, timestamp, or logo shift. The server publishes a normal and a low-battery frame every slot; the device measures its voltage and downloads the matching frame. Check that the two published frames differ only in the glyph region, and check the hysteresis band so the glyph does not flicker between refreshes. |

Setup takes precedence over all weather states. Confirm the refresh schedule: frames update every 30 minutes from 5:00 AM through 10:00 PM and the 10:00 PM frame stays on the panel until 5:00 AM. Confirm the fetch-failure behavior: a failed fetch (server or device side) leaves the previous frame and its timestamp untouched, and the timestamp never advances without fresh weather data.

## 7. Inspect the served frame and the panel, not only the design PNG

Feed the server the same fixture values as the reference and capture the **frame it serves**. It must be byte-identical to the corresponding export in `exports/`; a pixel diff script should report zero differing pixels. Then photograph or capture the panel showing that frame to confirm the device writes it without shifting, inverting, or cropping. Record any mismatch in:

1. Presence, order, and formatting of data.
2. Icon semantic choice and day/night variant.
3. Font size and legibility at approximate physical width.
4. Visible center lines and horizontal gaps.
5. Rule locations, stroke weights, and edge margins.
6. State-specific badges and precedence.

Because the server runs this pipeline inside the pinned container image, the served frame should be pixel-identical to the export; there is no font-conversion tolerance. The device draws nothing of its own. Also confirm the raw 15,000-byte framebuffer the device fetches decodes to the same pixels as the published PNG, and that `frame-lowbat.bin` differs from `frame.bin` only inside the low-battery glyph's box. Use `tools/framediff.py` for all of these comparisons.

## 8. Report findings for sign-off

Give Jeremy a short report containing: the exact build/verification command results; links to all selected normal and state frames; a table of pass/fail by fixture; annotated crops or coordinates for any mismatch; and a list of fixes or unresolved decisions. The design is approved; the report is about the implementation's fidelity to it. Any proposed change to a frame goes back to Jeremy before it is built.
