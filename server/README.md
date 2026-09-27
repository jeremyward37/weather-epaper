# Server

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
