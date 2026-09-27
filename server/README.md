# Server

## Render job (T11)

Run from the repository root. The pinned image supplies Node 22, `sharp`, and
Pillow 12.3.0, which writes PNGs byte-identically to the approved exports.

```sh
./tools/render.sh server --out public/
./tools/render.sh server --now 2026-09-27T17:30:00Z --dry-run
./tools/render.sh server --fixture design/fixtures/normal-summer.json --out public/fixture
./tools/render.sh server --fixture design/fixtures/normal-night.json --low-battery --out public/fixture
./tools/fixture-check.sh
```

Live mode fetches NWS data, fills the four future marks, three days, civil
twilight, and footer time, validates the fixture, renders both battery states,
and writes the six-file bundle documented below. Fixture mode skips NWS and
writes `frame.png`; it honors the fixture's `lowBattery` value, while
`--low-battery` forces the glyph on. `--dry-run` executes the full pipeline and
discards the staged output. `--out` defaults to the repository's `public/`.
`--now` is an offset-bearing ISO timestamp for reproducible live runs.

The CLI prints one JSON line on stdout for success, or one JSON line on stderr
and exits **2** on any error. Each line includes `level`, `step`, elapsed `ms`,
`dataUpdateTime`, and `footerTimestamp`. A failed run leaves `--out` untouched.
Output is built in a sibling temporary directory, then installed after every
file is ready; an existing directory is restored if installation fails. The
publish step in T12 should deploy this directory only after the command exits
successfully.

`config.json` holds the fixed coordinates, station, `America/Denver` time
zone, NWS contact address, retry/timeout policy, and framebuffer polarity.
There are no secret environment variables. The optional
`WEATHER_EPAPER_PYTHON` environment variable selects the pinned Python used
for PNG encoding; `tools/render.sh server` sets it to `python3` in the image.
The acceptance test command `node --test server/test` runs the same 356 tests as
`cd server && npm test`; outside the container, put Python with Pillow 12.3.0
on `PATH` for the framebuffer comparison tests.

## Time logic (T09)

`src/timing.js` exports `nextThreeHourMarks`, `nextThreeDays`, `civilEvents`, `isDay`, `footerTimestamp`, and `refreshWindow`. All accept a real instant (`Date` or an offset-bearing timestamp); local dates and labels use `America/Denver` regardless of the host time zone. The mark results have `{ instant, time }`, daily results have `{ date, day }`, and civil events have `{ event, time, instant }`. The `time`, `day`, and `event` values match the normal fixture fields directly. `refreshWindow` returns `{ inWindow, nextSlot }`; `nextSlot` is the next scheduled half-hour instant strictly after `now`. SunCalc 1.9.0 computes civil twilight at a solar altitude of −6°.

SunCalc 1.9.0 and its license are vendored in `vendor/`, so the timing module has no runtime installation step. Run `npm test` with Node 22 or newer.

## Frame bundle (T10)

`src/pack.js` accepts a **400×300, non-interlaced, 1-bit grayscale PNG** and returns a 15,000-byte row-major framebuffer (50 bytes per row). The default wire format has the leftmost pixel in the most significant bit and `1 = white`. `src/bundle.js` reads `config.json` at call time; change `whiteIsOne` or `msbFirst` there if the T14 hardware test requires it. Re-run `npm run pack:setup` after changing either flag.

`writeBundle(dir, { normalPng, lowbatPng, meta })` requires Buffer inputs and three nonempty metadata strings: `renderedAt`, `dataUpdateTime`, and `footerTimestamp`. It writes:

| File | Purpose |
|---|---|
| `frame.bin`, `frame-lowbat.bin` | Device payloads, 15,000 bytes each |
| `frame.png`, `frame-lowbat.png` | Human review copies of the input frames |
| `meta.json` | Timestamp fields, `schemaVersion: 1`, polarity and bit order, SHA-256 hashes |
| `index.html` | 1× and nearest-neighbor 3× previews plus metadata |

`sha256` covers the four frame files and `index.html`. It excludes `meta.json`, which contains the hashes and cannot hash itself. The publisher should stage the complete bundle before making it live so a device cannot read a partial update.

Run `npm test` with Node 22 and Python with Pillow 12.3.0. To review a generated bundle locally, run `python3 -m http.server` from its directory and open `index.html`.
## NWS data client (T08)

Use Node 22 or newer. `npm test` runs recorded-response tests without network access. `node test/record.js` refreshes the four dated NWS response files manually; it contacts only `api.weather.gov` with the contact address in `config.json`. `node bin/fetch.js --json` is a live data probe that prints a partial normal-state fixture.

`fetchAll(config, { fetchImpl, now })` re-resolves `/points` on each run, fetches the hourly and daily forecasts and the configured station's latest observation, and returns `{ hourly, daily, observation, meta }`. It throws `FetchError` for HTTP, network, freshness, and shape failures. The caller should keep the last published frame on any error. Optional `lastModified` and `cached` maps support conditional requests; a 304 without a cached body is an error.

`buildFixture({ nws, times })` takes those validated responses plus T09's time decisions:

```js
{
  now: '2026-09-27T05:35:00Z',
  timeZone: 'America/Denver',
  currentIsDay: false,
  marks: [{ at: '2026-09-27T00:00:00-06:00', time: '12 AM', isDay: false }], // four total
  days: [{ date: '2026-09-27', day: 'Sun' }], // three total, starting tomorrow locally
  localNow: '...', lastUpdate: '...', sun: { event: 'civilDawn', time: '...' }
}
```

T09 owns mark selection, civil day/night, dawn/dusk, and display formatting. The CLI uses provisional NWS period labels solely to check live fetch and fixture shape. Its output lacks `localNow`, `lastUpdate`, and `sun`, so it is not ready for rendering or `validateNormal` until T09 supplies those fields.
