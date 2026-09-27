# Condition and precipitation icon map

Status: **Design approved.** Checkpoint 3 closed 2026-09-25: Jeremy approved the setup and low-battery screens, which with the checkpoint 2 normal state completes the design. The setup screen's `Password: firstlight` line was added after that review and approved by Jeremy the same day. Under server-side rendering (decided 2026-09-25) these bitmaps are produced by the server's copy of the pipeline; the manifest below is the complete icon inventory rather than a firmware flash deliverable. The mapping from NWS forecast fields to the semantic names in the first column is documented in [`../docs/nws-condition-map.md`](../docs/nws-condition-map.md). The selected layout uses a 66 px current icon, 32 px hourly condition icons, 36 px daily icons, a 30 px civil-twilight icon, a 14 px refresh icon, a 14 px low-battery icon when needed, and a 20 px footer logo. Setup uses the same logo at 64 px. The stale badge and alert state were removed from scope on 2026-09-25; no other icons are used. There is no separate precipitation-type glyph in the selected layout.

| Condition | Day source | Night source |
|---|---|---|
| Clear | `wi-day-sunny.svg` | `wi-night-clear.svg` |
| Mostly clear | `wi-day-sunny-overcast.svg` | `wi-night-alt-partly-cloudy.svg` |
| Partly cloudy | `wi-day-cloudy.svg` | `wi-night-partly-cloudy.svg` |
| Mostly cloudy | `wi-day-cloudy-high.svg` | `wi-night-cloudy-high.svg` |
| Overcast | `wi-cloudy.svg` | `wi-cloudy.svg` |
| Fog / haze | `wi-day-haze.svg` | `wi-night-fog.svg` |
| Wind | `wi-day-windy.svg` | `wi-night-cloudy-windy.svg` |
| Rain | `wi-day-rain.svg` | `wi-night-rain.svg` |
| Showers | `wi-day-showers.svg` | `wi-night-showers.svg` |
| Drizzle | `wi-day-sprinkle.svg` | `wi-night-sprinkle.svg` |
| Snow | `wi-day-snow.svg` | `wi-night-snow.svg` |
| Flurries | `wi-day-snow-wind.svg` | `wi-night-snow-wind.svg` |
| Mix / sleet / freezing rain | `wi-day-rain-mix.svg` | `wi-night-rain-mix.svg` |
| Thunderstorm | `wi-day-thunderstorm.svg` | `wi-night-thunderstorm.svg` |
| Hail | `wi-day-hail.svg` | `wi-night-hail.svg` |
| Smoke | `wi-smoke.svg` | `wi-smoke.svg` |

**Gaps:** the neutral overcast and smoke marks are valid in both light and dark hours. A special night haze mark is absent, so night fog is used for the combined fog/haze condition. The server mapper takes the NWS period fields and a civil daylight flag. When chance is positive, it chooses a condition icon that visibly carries its rain, snow, mix, or thunder type; a plain cloud icon with a positive rain percentage would no longer meet Jeremy's request.

## Firmware bitmap manifest

The default build produces exactly these 96 thresholded 1-bit PNGs. All paths in the first column are under `assets/icons/`; source assets are under `assets/source/`. The two neutral conditions, `overcast` and `smoke`, each have one bitmap for use in both daylight and darkness.

| Kind | Bitmap file | Semantic name | Size (px) | Source asset |
|---|---|---|---:|---|
| Condition | `clearDay-66.png` | `clearDay` | 66 | `wi-day-sunny.svg` |
| Condition | `clearDay-32.png` | `clearDay` | 32 | `wi-day-sunny.svg` |
| Condition | `clearDay-36.png` | `clearDay` | 36 | `wi-day-sunny.svg` |
| Condition | `clearNight-66.png` | `clearNight` | 66 | `wi-night-clear.svg` |
| Condition | `clearNight-32.png` | `clearNight` | 32 | `wi-night-clear.svg` |
| Condition | `clearNight-36.png` | `clearNight` | 36 | `wi-night-clear.svg` |
| Condition | `mostlyClearDay-66.png` | `mostlyClearDay` | 66 | `wi-day-sunny-overcast.svg` |
| Condition | `mostlyClearDay-32.png` | `mostlyClearDay` | 32 | `wi-day-sunny-overcast.svg` |
| Condition | `mostlyClearDay-36.png` | `mostlyClearDay` | 36 | `wi-day-sunny-overcast.svg` |
| Condition | `mostlyClearNight-66.png` | `mostlyClearNight` | 66 | `wi-night-alt-partly-cloudy.svg` |
| Condition | `mostlyClearNight-32.png` | `mostlyClearNight` | 32 | `wi-night-alt-partly-cloudy.svg` |
| Condition | `mostlyClearNight-36.png` | `mostlyClearNight` | 36 | `wi-night-alt-partly-cloudy.svg` |
| Condition | `partlyDay-66.png` | `partlyDay` | 66 | `wi-day-cloudy.svg` |
| Condition | `partlyDay-32.png` | `partlyDay` | 32 | `wi-day-cloudy.svg` |
| Condition | `partlyDay-36.png` | `partlyDay` | 36 | `wi-day-cloudy.svg` |
| Condition | `partlyNight-66.png` | `partlyNight` | 66 | `wi-night-partly-cloudy.svg` |
| Condition | `partlyNight-32.png` | `partlyNight` | 32 | `wi-night-partly-cloudy.svg` |
| Condition | `partlyNight-36.png` | `partlyNight` | 36 | `wi-night-partly-cloudy.svg` |
| Condition | `cloudyDay-66.png` | `cloudyDay` | 66 | `wi-day-cloudy-high.svg` |
| Condition | `cloudyDay-32.png` | `cloudyDay` | 32 | `wi-day-cloudy-high.svg` |
| Condition | `cloudyDay-36.png` | `cloudyDay` | 36 | `wi-day-cloudy-high.svg` |
| Condition | `cloudyNight-66.png` | `cloudyNight` | 66 | `wi-night-cloudy-high.svg` |
| Condition | `cloudyNight-32.png` | `cloudyNight` | 32 | `wi-night-cloudy-high.svg` |
| Condition | `cloudyNight-36.png` | `cloudyNight` | 36 | `wi-night-cloudy-high.svg` |
| Condition | `overcast-66.png` | `overcast` | 66 | `wi-cloudy.svg` |
| Condition | `overcast-32.png` | `overcast` | 32 | `wi-cloudy.svg` |
| Condition | `overcast-36.png` | `overcast` | 36 | `wi-cloudy.svg` |
| Condition | `fogDay-66.png` | `fogDay` | 66 | `wi-day-haze.svg` |
| Condition | `fogDay-32.png` | `fogDay` | 32 | `wi-day-haze.svg` |
| Condition | `fogDay-36.png` | `fogDay` | 36 | `wi-day-haze.svg` |
| Condition | `fogNight-66.png` | `fogNight` | 66 | `wi-night-fog.svg` |
| Condition | `fogNight-32.png` | `fogNight` | 32 | `wi-night-fog.svg` |
| Condition | `fogNight-36.png` | `fogNight` | 36 | `wi-night-fog.svg` |
| Condition | `windDay-66.png` | `windDay` | 66 | `wi-day-windy.svg` |
| Condition | `windDay-32.png` | `windDay` | 32 | `wi-day-windy.svg` |
| Condition | `windDay-36.png` | `windDay` | 36 | `wi-day-windy.svg` |
| Condition | `windNight-66.png` | `windNight` | 66 | `wi-night-cloudy-windy.svg` |
| Condition | `windNight-32.png` | `windNight` | 32 | `wi-night-cloudy-windy.svg` |
| Condition | `windNight-36.png` | `windNight` | 36 | `wi-night-cloudy-windy.svg` |
| Condition | `rainDay-66.png` | `rainDay` | 66 | `wi-day-rain.svg` |
| Condition | `rainDay-32.png` | `rainDay` | 32 | `wi-day-rain.svg` |
| Condition | `rainDay-36.png` | `rainDay` | 36 | `wi-day-rain.svg` |
| Condition | `rainNight-66.png` | `rainNight` | 66 | `wi-night-rain.svg` |
| Condition | `rainNight-32.png` | `rainNight` | 32 | `wi-night-rain.svg` |
| Condition | `rainNight-36.png` | `rainNight` | 36 | `wi-night-rain.svg` |
| Condition | `showersDay-66.png` | `showersDay` | 66 | `wi-day-showers.svg` |
| Condition | `showersDay-32.png` | `showersDay` | 32 | `wi-day-showers.svg` |
| Condition | `showersDay-36.png` | `showersDay` | 36 | `wi-day-showers.svg` |
| Condition | `showersNight-66.png` | `showersNight` | 66 | `wi-night-showers.svg` |
| Condition | `showersNight-32.png` | `showersNight` | 32 | `wi-night-showers.svg` |
| Condition | `showersNight-36.png` | `showersNight` | 36 | `wi-night-showers.svg` |
| Condition | `drizzleDay-66.png` | `drizzleDay` | 66 | `wi-day-sprinkle.svg` |
| Condition | `drizzleDay-32.png` | `drizzleDay` | 32 | `wi-day-sprinkle.svg` |
| Condition | `drizzleDay-36.png` | `drizzleDay` | 36 | `wi-day-sprinkle.svg` |
| Condition | `drizzleNight-66.png` | `drizzleNight` | 66 | `wi-night-sprinkle.svg` |
| Condition | `drizzleNight-32.png` | `drizzleNight` | 32 | `wi-night-sprinkle.svg` |
| Condition | `drizzleNight-36.png` | `drizzleNight` | 36 | `wi-night-sprinkle.svg` |
| Condition | `snowDay-66.png` | `snowDay` | 66 | `wi-day-snow.svg` |
| Condition | `snowDay-32.png` | `snowDay` | 32 | `wi-day-snow.svg` |
| Condition | `snowDay-36.png` | `snowDay` | 36 | `wi-day-snow.svg` |
| Condition | `snowNight-66.png` | `snowNight` | 66 | `wi-night-snow.svg` |
| Condition | `snowNight-32.png` | `snowNight` | 32 | `wi-night-snow.svg` |
| Condition | `snowNight-36.png` | `snowNight` | 36 | `wi-night-snow.svg` |
| Condition | `flurriesDay-66.png` | `flurriesDay` | 66 | `wi-day-snow-wind.svg` |
| Condition | `flurriesDay-32.png` | `flurriesDay` | 32 | `wi-day-snow-wind.svg` |
| Condition | `flurriesDay-36.png` | `flurriesDay` | 36 | `wi-day-snow-wind.svg` |
| Condition | `flurriesNight-66.png` | `flurriesNight` | 66 | `wi-night-snow-wind.svg` |
| Condition | `flurriesNight-32.png` | `flurriesNight` | 32 | `wi-night-snow-wind.svg` |
| Condition | `flurriesNight-36.png` | `flurriesNight` | 36 | `wi-night-snow-wind.svg` |
| Condition | `mixDay-66.png` | `mixDay` | 66 | `wi-day-rain-mix.svg` |
| Condition | `mixDay-32.png` | `mixDay` | 32 | `wi-day-rain-mix.svg` |
| Condition | `mixDay-36.png` | `mixDay` | 36 | `wi-day-rain-mix.svg` |
| Condition | `mixNight-66.png` | `mixNight` | 66 | `wi-night-rain-mix.svg` |
| Condition | `mixNight-32.png` | `mixNight` | 32 | `wi-night-rain-mix.svg` |
| Condition | `mixNight-36.png` | `mixNight` | 36 | `wi-night-rain-mix.svg` |
| Condition | `thunderDay-66.png` | `thunderDay` | 66 | `wi-day-thunderstorm.svg` |
| Condition | `thunderDay-32.png` | `thunderDay` | 32 | `wi-day-thunderstorm.svg` |
| Condition | `thunderDay-36.png` | `thunderDay` | 36 | `wi-day-thunderstorm.svg` |
| Condition | `thunderNight-66.png` | `thunderNight` | 66 | `wi-night-thunderstorm.svg` |
| Condition | `thunderNight-32.png` | `thunderNight` | 32 | `wi-night-thunderstorm.svg` |
| Condition | `thunderNight-36.png` | `thunderNight` | 36 | `wi-night-thunderstorm.svg` |
| Condition | `hailDay-66.png` | `hailDay` | 66 | `wi-day-hail.svg` |
| Condition | `hailDay-32.png` | `hailDay` | 32 | `wi-day-hail.svg` |
| Condition | `hailDay-36.png` | `hailDay` | 36 | `wi-day-hail.svg` |
| Condition | `hailNight-66.png` | `hailNight` | 66 | `wi-night-hail.svg` |
| Condition | `hailNight-32.png` | `hailNight` | 32 | `wi-night-hail.svg` |
| Condition | `hailNight-36.png` | `hailNight` | 36 | `wi-night-hail.svg` |
| Condition | `smoke-66.png` | `smoke` | 66 | `wi-smoke.svg` |
| Condition | `smoke-32.png` | `smoke` | 32 | `wi-smoke.svg` |
| Condition | `smoke-36.png` | `smoke` | 36 | `wi-smoke.svg` |
| Support | `dawn-30.png` | `dawn` | 30 | `wi-sunrise.svg` |
| Support | `dusk-30.png` | `dusk` | 30 | `wi-sunset.svg` |
| Support | `refresh-14.png` | `refresh` | 14 | `refresh-icon.png` |
| Support | `lowBattery-14.png` | `lowBattery` | 14 | `battery_alert_0deg.svg` |
| Support | `logo-20.png` | `logo` | 20 | `sovereign-aperture-black.svg` |
| Support | `logo-64.png` | `logo` | 64 | `sovereign-aperture-black.svg` |

`lowBattery-14.png` uses the simplified outline generated in `build.js` because direct rasterization of `battery_alert_0deg.svg` loses its outline. The SVG in the table records the design source, not a byte-for-byte raster source.

At 32 px the source flurry marks became indistinguishable from snow, and hail retained only one tiny pellet beside rain-like strokes. `build.js` now adds two wind strokes to both flurries variants and two square ice pellets to both hail variants at all live sizes. The listed Weather Icons SVG remains the cloud and precipitation source; these marks are generated overlays. The thresholded 1× and nearest-neighbor 3× bitmaps were reviewed at 32, 36, and 66 px.

## Historical concept glyphs

The four small precipitation glyphs below are generated only with `./build.sh --all` for the early concept exports under `exports/archive/`. They are absent from the default firmware asset set and are **not** displayed in the selected four-mark normal exports.

| Precip type | Concept bitmap | Treatment |
|---|---|---|
| Rain, showers, drizzle | `assets/icons/typeRain-14.png` | Simplified drop from `wi-raindrop.svg` semantics |
| Snow | `assets/icons/typeSnow-14.png` | Simplified six-arm snowflake from `wi-snowflake-cold.svg` semantics |
| Mix, sleet, freezing rain | `assets/icons/typeMix-14.png` | Drop plus cross, replacing the cramped `wi-sleet.svg` |
| Thunderstorm | `assets/icons/typeThunder-14.png` | Simplified bolt from `wi-lightning.svg` semantics |

Weather Icons are SIL OFL 1.1. The four simplified glyphs are new artwork in this design, retained only to reproduce the earlier concept exports. The supplied refresh mark and local Sovereign Aperture logo are separately sourced.

The low-battery overlay uses `assets/icons/lowBattery-14.png`, a hand-simplified outline based on the meaning of `battery_alert_0deg.svg`; the original source bitmap lost its outline at 14 px. The mark appears only below about 15% battery. The displayed dawn/dusk icons are sourced from `wi-sunrise.svg` and `wi-sunset.svg`, but the screen labels them **First light** and **Last light** to convey civil dawn and civil dusk.
