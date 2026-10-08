# T24 daily low/high re-baseline evidence

Prepared 2026-10-07 against accepted base `637c2751c740f1a6dfe939a45acece1f09e5b74f`. Jeremy authorized preparing T24: change three daily `H°/L°` pairs to `L°/H°` only. Concrete re-baseline acceptance, independent QA, review-head CI, merge and deployment remain separate pending gates.

The canonical renderer changes one text expression. NWS high/daytime and low/following-night field meanings, dates, day labels, icons, chance, anchors, typefaces, separators and all other content remain unchanged. The setup frame and its 3× preview are byte-identical. Icon assets did not change.

## Pinned checks

Image `weather-epaper-render:5830ef899537` uses the repository's locked Dockerfile/dependencies. Actual `./tools/render.sh` execution regenerated all seven exports through `./build.sh`; verifier printed **PASS**, including true 1-bit output, 4 px margins, visible centers, 96 icons, 53 image references and minimum 5 px hourly gap. Its base-HEAD comparison exited 1 for the expected approved-scope old/new differences below. This expected re-baseline comparison is distinct from comparing the new canonical references to new outputs.

A second pinned `./build.sh` printed PASS. Comparing all seven second-build outputs to saved first-build references with `tools/framediff.py` produced seven zero-difference rows and seven byte-identical files. `./tools/fixture-check.sh` produced six zero-difference rows and passed all six PNG `cmp` checks. Pinned `node --test design/test` passed 4/4; server `npm test` passed 359/359. The new design regression exercises both battery variants and all three row centers with explicit labels `-24°/-12°`, `-12°/108°`, `100°/108°`, `7°/7°`, `108°/-24°`, `-99°/-88°`. The deliberately inverted field values detect unwanted sorting. A 600 px isolated raster detects text extending past the 400 px panel and verifies every visible text pixel appears in the complete frame. Fixture deep equality checks preserve semantic inputs.

## Before/after pixel boundary

Saved base frames: `/private/tmp/weather-epaper-t24-before/{normal,states}/`; saved first-build frames: `/private/tmp/weather-epaper-t24-after/{normal,states}/`. The repository's repeatable check is:

```sh
python3 design/test/check-t24-rebaseline.py /path/to/base/exports
```

Supply base files extracted from the accepted Git revision in the usual `normal/` and `states/` folders. The check calls `tools/framediff.py`, verifies true 1-bit dimensions, and rejects any changed pixel outside **x=303..395 inclusive, y=111..137, 163..189, 215..241 inclusive**. These are the three temperature text masks around the unchanged centers y=126/178/230; they exclude daily icons and the chance lines.

| Frame | Changed pixels | Outside text masks |
|---|---:|---:|
| normal-summer | 931 | 0 |
| normal-winter | 1046 | 0 |
| normal-spring | 611 | 0 |
| normal-widths | 956 | 0 |
| normal-night | 611 | 0 |
| state-setup | 0; byte-identical | 0 |
| state-low-battery | 611 | 0 |

Visual implementation inspection of thresholded native winter and 3× widths exports passed: low precedes high, signed values fit, the chance line remains clear, and anchors are stable. This is software visual evidence; no new physical-panel observation or release is claimed.

## New canonical SHA-256

```text
normal-summer.png     cdc491d54cc0bbc576a32e76d5f80a7d0b5df5479ae588ef765870ba2df68aac
normal-winter.png     5a60f56d5e6b7422fc3fbffd8ebd92dda9092d81d365b02d7ebe178cc6a36e32
normal-spring.png     324e4ef4a3affc3247c0c9ff148b05496b5b4d7c57d0a31e075db670eddd61fd
normal-widths.png     1817f194838c1f6be1d23ae2140fdffe84f631cf60ce667f2c05041fce796811
normal-night.png      f9a72b1ee7713fc36af0c8f89f72f0dd2a8684ccef640e5bfa389ea984f588d3
state-setup.png       124ef9ea0fecd9473ebf971f47d93581cc549c685b09261196b2f7a1429d911d
state-low-battery.png f9a72b1ee7713fc36af0c8f89f72f0dd2a8684ccef640e5bfa389ea984f588d3
```

After committing the authorized new references, `./tools/render.sh` must pass against the review head with seven zero-difference rows in required CI. Jeremy reviews the concrete before/after frames and explicitly accepts the new references before merge/deployment.
