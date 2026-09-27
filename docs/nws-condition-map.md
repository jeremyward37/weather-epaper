# NWS condition mapping

`server/src/conditions.js` maps an NWS forecast period to the approved condition icon contract. Its inputs are the period's `icon` URL or relative path, `shortForecast`, `probabilityOfPrecipitation.value` (passed as `pop`), temperature in °F, and a **civil** `isDay` boolean from the caller. `mapPeriod()` returns `{ icon, precip, type }`. It does no fetching or time calculation.

The [NWS API documentation](https://www.weather.gov/documentation/services-web-api) describes the forecast endpoints and required User-Agent. The [NWS icon guide](https://www.weather.gov/forecast-icons) explains dual icons: two six-hour halves within a twelve-hour forecast. This table covers the 34 codes listed by the [NWS icon endpoint](https://api.weather.gov/icons). `type` is the type implied by a positive chance; the returned `type` is always `null` when the returned chance is zero.

| NWS code | Base semantic | Implied type | Notes |
|---|---|---|---|
| `skc` | `clear` | null | Clear sky. |
| `few` | `mostlyClear` | null | Few clouds. |
| `sct` | `partly` | null | Scattered clouds. |
| `bkn` | `cloudy` | null | Broken cloud cover. |
| `ovc` | `overcast` | null | Same icon day and night. |
| `wind_skc` | `wind` | null | Wind over clear sky. |
| `wind_few` | `wind` | null | Wind over few clouds. |
| `wind_sct` | `wind` | null | Wind over scattered clouds. |
| `wind_bkn` | `wind` | null | Wind over broken cloud cover. |
| `wind_ovc` | `wind` | null | Wind over overcast sky. |
| `snow` | `snow` | `Snow` | Snow. |
| `rain_snow` | `mix` | `Mix` | Rain and snow. |
| `rain_sleet` | `mix` | `Mix` | Rain and sleet. |
| `snow_sleet` | `mix` | `Mix` | Snow and sleet. |
| `fzra` | `mix` | `Mix` | Freezing rain. |
| `rain_fzra` | `mix` | `Mix` | Rain and freezing rain. |
| `snow_fzra` | `mix` | `Mix` | Snow and freezing rain. |
| `sleet` | `mix` | `Mix` | Sleet. |
| `rain` | `rain` | `Rain` | Steady rain. |
| `rain_showers` | `showers` | `Rain` | Showers. |
| `rain_showers_hi` | `showers` | `Rain` | Showers with higher cloud cover. |
| `tsra` | `thunder` | `Thunder` | Thunderstorms. |
| `tsra_sct` | `thunder` | `Thunder` | Scattered thunderstorms. |
| `tsra_hi` | `thunder` | `Thunder` | Thunderstorms with higher cloud cover. |
| `tornado` | `thunder` | `Thunder` | Closest available condition mark; no alert state. |
| `hurricane` | `thunder` | `Thunder` | Closest available condition mark; no alert state. |
| `tropical_storm` | `thunder` | `Thunder` | Closest available condition mark; no alert state. |
| `dust` | `smoke` | null | Closest particulate-air mark; same day and night. |
| `smoke` | `smoke` | null | Same day and night. |
| `haze` | `fog` | null | Shared fog/haze artwork. |
| `hot` | `clear` | null | Cloud wording may override this base. |
| `cold` | `clear` | null | Cloud wording may override this base. |
| `blizzard` | `flurries` | `Snow` | Wind strokes distinguish it from ordinary snow. |
| `fog` | `fog` | null | Fog. |

## Rules, in order

1. Parse the `/icons/land/{day|night}/{code}[,{pop}][/{code2}[,{pop2}]]` path from an absolute URL or relative path. Ignore `?size=…`. Unknown codes, malformed paths, or more than two halves fail closed. The parsed NWS day/night token is returned for inspection; **it does not choose the design variant**.
2. A single-code hourly icon uses that code. For a dual daily icon, select the half with the larger icon-embedded PoP. Missing embedded PoP counts as zero. On a tie, select the **second (afternoon) half**, representing the later part of the daytime period. The period's own PoP still controls the displayed percentage; the embedded values choose only the condition.
3. Map the selected code using the table. For `hot` and `cold`, explicit cloud wording in `shortForecast` can refine the base to `overcast`, `cloudy`, `partly`, or `mostlyClear`. Then the specific terms **thunder**, **hail**, **sleet/freezing/wintry mix/rain and snow**, **flurries**, and **drizzle** refine the base, in that precedence order. These refinements let the free-text forecast name a condition more specific than its icon code.
4. Round numeric period PoP to an integer and clamp to `0..100`; `null` or absent means zero. If the result is positive and the base icon has no precipitation type, promote it using `shortForecast`: thunder or hail → `thunder`; mixed or freezing precipitation → `mix`; flurries or snow → `flurries` or `snow`; rain, showers, or drizzle → `showers`. If no keyword identifies a type, temperature **≤ 34 °F** → `snow`, otherwise → `showers`. Missing temperature in this last case is an error. A positive chance with `hail` also becomes `thunder`: the approved fixture validator recognizes only Rain, Snow, Mix, or Thunder names for positive PoP, while `hailDay`/`hailNight` remain available when PoP is zero.
5. If PoP is zero, keep even a precipitation-bearing condition icon, but return `precip: 0, type: null`; the frame leaves its percentage blank. With positive PoP, return the type implied by the final base: `Rain`, `Snow`, `Mix`, or `Thunder`. This matches `design/build.js` `validateNormal()`.
6. Append `Day` or `Night` according to the supplied civil `isDay` boolean for the 14 variant bases. `overcast` and `smoke` are neutral and have no suffix. NWS `isDaytime` and the URL's day/night segment never override civil dawn/dusk.

The dated raw responses in `server/test/fixtures/nws/` came from `SLC/98,198` with `User-Agent: (weather-epaper, jeremy@builtbyjer.com)` and `Accept: application/geo+json` on 2026-09-26. Their real `shortForecast` phrases and all periods are test vectors. The tests also enumerate every code in both civil day and night, check the complete icon manifest in `design/icon-map.md`, and enforce the positive-PoP type regexes from `validateNormal()`.
