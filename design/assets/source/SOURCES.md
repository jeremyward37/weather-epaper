# Source artwork provenance

Everything `design/build.js` rasterizes comes from this folder, so the project builds from a clone of this repository alone. Do not edit these files in place; replace them from the master and rebuild.

| File(s) | Master location | License / rules |
|---|---|---|
| `wi-*.svg` | [RockBase-iot/esp32-weather-epd](https://github.com/RockBase-iot/esp32-weather-epd), `icons/svg/`, commit `ff5001b` (Weather Icons by Erik Flowers) | SIL OFL 1.1 |
| `battery_alert_0deg.svg` | Same repository, `icons/svg/` (Google Material) | Apache 2.0. Not used directly; `build.js` draws a simplified outline for `lowBattery` because this source collapses at 14 px. |
| `refresh-icon.png` | Supplied by Jeremy, 512 × 512 RGBA. Previously at `assets/refresh-icon.png` in the project root. | Jeremy's artwork |
| `sovereign-aperture-black.svg` | Copy of `../personal-logo/final/svg/sovereign-aperture-black.svg` (sibling `personal-logo` project). Usage rules: `../personal-logo/final/README.md`. | Jeremy's brand asset. No stretching, outlining, rotating, or effects; keep clear space of one diamond-width; keep the arch/diamond relationship intact. |

Fonts are in `../fonts/`: Lato, Raleway, Montserrat (SIL OFL 1.1) and Roboto Mono (Apache 2.0), also taken from the esp32-weather-epd `fonts/` directory.

The logo here is a deliberate snapshot. The approved exports pin a specific 1-bit rendering of it, so an upstream change to the master should be pulled in consciously and re-reviewed, not picked up silently.
