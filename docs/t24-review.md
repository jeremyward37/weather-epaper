# T24 review packet — daily forecast LO/HI

[Task card](https://app.notion.com/p/3f2d9adbacad81af943af1a0f1cb24fb) · branch `codex/t24-daily-low-high` · accepted base `637c2751c740f1a6dfe939a45acece1f09e5b74f`.

Jeremy requested daily temperatures in low/high order and then explicitly requested T24 start now. The correction changes all three daily rows from `H°/L°` to `L°/H°`. For example, a daytime high75 and following-night low52 now render `52°/75°`. Server NWS values and date/day/night pairing keep their existing meanings. Font, location, slash formatting, icons, precipitation, footer, twilight, hourly/current values and setup are preserved.

T24 is isolated from accepted main, so it does not include or release unfinished T16 firmware. T16 stays In progress in [PR21](https://github.com/jeremyward37/weather-epaper/pull/21), installed corrected3fc/app4d9e35cf; pending timed/offline/buttons/current limitations remain on that card. No device operation, reflash, router or hosting change occurred in T24.

## Software verification

Pinned `./build.sh` prints PASS; seven newly rendered canonical frames match byte-for-byte across repeated builds; six CLI fixture rows match their references with0pixels and identicalPNG bytes. Four design tests and359server tests Pass. Signed/equal/wide/adversarial values fit, with complete text ink preserved and fixture values unchanged. Old/new pixel differences are931/1046/611/956/611/0/611 across summer/winter/spring/widths/night/setup/low-battery, with0changedpixels outside the three daily text masks. Setup and setup3x byte-identical; icon assets unchanged. See [re-baseline evidence and seven hashes](t24-rebaseline.md).

[Independent QA](t24-qa.md) passes with no unresolved defects, including a separate recorded-NWS semantic check. Required exact-head CI is recorded on the pull request/card before the final review pause. Acceptance criteria stay pending until the exact review revision passes those gates and Jeremy accepts the concrete regenerated references.

## Thresholded before/after frames

The following links show native400×300true1-bit PNGs. Setup has no order labels and is unchanged.

| Frame | Accepted base | Proposed reference |
|---|---|---|
| normal-summer | [HI/LO before](https://github.com/jeremyward37/weather-epaper/blob/637c2751c740f1a6dfe939a45acece1f09e5b74f/design/exports/normal/normal-summer.png) | [LO/HI proposed](../design/exports/normal/normal-summer.png) |
| normal-winter | [HI/LO before](https://github.com/jeremyward37/weather-epaper/blob/637c2751c740f1a6dfe939a45acece1f09e5b74f/design/exports/normal/normal-winter.png) | [LO/HI proposed](../design/exports/normal/normal-winter.png) |
| normal-spring | [HI/LO before](https://github.com/jeremyward37/weather-epaper/blob/637c2751c740f1a6dfe939a45acece1f09e5b74f/design/exports/normal/normal-spring.png) | [LO/HI proposed](../design/exports/normal/normal-spring.png) |
| normal-widths | [HI/LO before](https://github.com/jeremyward37/weather-epaper/blob/637c2751c740f1a6dfe939a45acece1f09e5b74f/design/exports/normal/normal-widths.png) | [LO/HI proposed](../design/exports/normal/normal-widths.png) |
| normal-night | [HI/LO before](https://github.com/jeremyward37/weather-epaper/blob/637c2751c740f1a6dfe939a45acece1f09e5b74f/design/exports/normal/normal-night.png) | [LO/HI proposed](../design/exports/normal/normal-night.png) |
| state-setup | [HI/LO before](https://github.com/jeremyward37/weather-epaper/blob/637c2751c740f1a6dfe939a45acece1f09e5b74f/design/exports/states/state-setup.png) | [LO/HI proposed](../design/exports/states/state-setup.png) |
| state-low-battery | [HI/LO before](https://github.com/jeremyward37/weather-epaper/blob/637c2751c740f1a6dfe939a45acece1f09e5b74f/design/exports/states/state-low-battery.png) | [LO/HI proposed](../design/exports/states/state-low-battery.png) |

The existing [design index](../design/index.html) displays the proposed set at physical width, native and3× sizes; review the thresholded PNGs. Low-battery changes only the same daily labels while retaining its footer glyph.

## Needs Jeremy

Review the before/after frames, especially signed/wide winter/widths, and explicitly accept T24's LO/HI re-baseline and authorize its PR merge/publishing if satisfied. The project [AGENTS.md](../AGENTS.md) and [orchestration.md](orchestration.md) require explicit authorization for merge/new deployment; start-now approval covers implementation and review preparation. Keep T24 In progress until required CI, independent QA, Jeremy acceptance and authorized merge are recorded. No firmware flash is necessary: after authorized main publication, the installed weather firmware fetches the new server frame on a later successful wake. No exact on-device timing is promised.

## Rollback

Revert the T24 renderer/spec/verification/exports together in a reviewed revert. Do not hand-edit generated files or swap NWS data fields to compensate. Existing T16 firmware/artifacts do not change.
