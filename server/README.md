# Server modules

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
