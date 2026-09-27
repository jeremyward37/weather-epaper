# Frame bundle (T10)

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
