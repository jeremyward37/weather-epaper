# T03 renderer re-baseline report

**Status:** awaiting Jeremy's T04 review. The approved exports have not been accepted as replaced, and `design/spec.md` / `design/verify.py` have not been loosened.

## Environment

- Base image: `node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c`
- Node: 22.23.3
- `sharp`: 0.33.5; libvips 8.15.3
- Text stack bundled with `sharp`: fontconfig 2.15.0, FreeType 2.13.2, HarfBuzz 9.0.0, Pango 1.54.0, librsvg 2.58.93
- Python: 3.11.2; Pillow 12.3.0
- Fonts: only the vendored files in `design/assets/fonts/`; font hinting is explicitly disabled in the generated fontconfig file.

The original approved frames were produced on macOS with Node 16.15 and `sharp` 0.32.6. Moving fontconfig initialization ahead of the `sharp` import and explicitly disabling font hinting did not eliminate the residual Linux/macOS text rasterization difference. All 96 generated icon bitmaps are pixel-identical to the approved versions; only their PNG encoding bytes changed. The frame differences below are therefore text-glyph rasterization differences, not icon, anchor, fixture, or layout-number changes.

## Pixel differences

`tools/render.sh` ran all six `framediff` tests, regenerated the seven frames in the pinned container, and printed this table before exiting nonzero:

| Frame | Differing pixels | Difference bounds `(x,y,w,h)` | Review artifacts |
|---|---:|---:|---|
| `normal-summer.png` | 5,299 | `(8,22,374,270)` | [diff](rebaseline/normal-summer-diff.png) · [approved crop 3×](rebaseline/normal-summer-reference-crop@3x.png) · [container crop 3×](rebaseline/normal-summer-container-crop@3x.png) |
| `normal-winter.png` | 5,165 | `(8,23,366,269)` | [diff](rebaseline/normal-winter-diff.png) · [approved crop 3×](rebaseline/normal-winter-reference-crop@3x.png) · [container crop 3×](rebaseline/normal-winter-container-crop@3x.png) |
| `normal-spring.png` | 4,520 | `(8,27,366,265)` | [diff](rebaseline/normal-spring-diff.png) · [approved crop 3×](rebaseline/normal-spring-reference-crop@3x.png) · [container crop 3×](rebaseline/normal-spring-container-crop@3x.png) |
| `normal-widths.png` | 7,631 | `(8,27,375,265)` | [diff](rebaseline/normal-widths-diff.png) · [approved crop 3×](rebaseline/normal-widths-reference-crop@3x.png) · [container crop 3×](rebaseline/normal-widths-container-crop@3x.png) |
| `normal-night.png` | 5,228 | `(8,23,366,269)` | [diff](rebaseline/normal-night-diff.png) · [approved crop 3×](rebaseline/normal-night-reference-crop@3x.png) · [container crop 3×](rebaseline/normal-night-container-crop@3x.png) |
| `state-setup.png` | 5,738 | `(36,103,308,168)` | [diff](rebaseline/state-setup-diff.png) · [approved crop 3×](rebaseline/state-setup-reference-crop@3x.png) · [container crop 3×](rebaseline/state-setup-container-crop@3x.png) |
| `state-low-battery.png` | 5,228 | `(8,23,366,269)` | [diff](rebaseline/state-low-battery-diff.png) · [approved crop 3×](rebaseline/state-low-battery-reference-crop@3x.png) · [container crop 3×](rebaseline/state-low-battery-container-crop@3x.png) |

The approved and container crop for each row uses the same difference bounding box with 4 px of padding and nearest-neighbor 3× enlargement.

## Verification finding

The container output still satisfies size, 1-bit color, safe-margin, alignment, state, and fixture rules up to the first failing assertion. `design/verify.py` stops on `normal-widths` hourly row 3 because the Linux text raster is two pixels wider: the measured horizontal gap is 5 px instead of the approved minimum 7 px. No layout number or check was changed to conceal that failure.

T04 must decide whether the container output is visually acceptable. If accepted, update the rendering contract and mechanical check together for the measured 5 px minimum, then commit the container-generated canonical frames and previews. If rejected, T03 remains open for a different pinned rendering stack.
