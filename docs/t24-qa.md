# T24 independent acceptance QA

2026-10-07/08 · GPT-6.1 Sol, High · independent `t24_qa` agent.

**Verdict: software acceptance PASS. No unresolved implementation defects found. Required exact-review-head CI, Jeremy’s concrete re-baseline acceptance, and authorized merge remain Pending; T24 must remain In progress.**

One documentation inconsistency was found and fixed by the orchestrator during this review: `docs/scope.md` §5 still described the daily pair as high/low. Current readback says low/high (`L°/H°`, T24); §4 still correctly assigns high to daytime and low to the following night.

## Revision and limits

Reviewed `codex/t24-daily-low-high`, isolated worktree `/Users/jeremyward/.codex/worktrees/t24-daily-low-high/weather-epaper`, against accepted base `637c2751c740f1a6dfe939a45acece1f09e5b74f`. This was the completed implementation’s uncommitted review snapshot; orchestrator owns the final commit/PR/CI gate. Renderer SHA-256 `ab1aa0f9bcd6af408accd29e4e463dc2ccf551010abb3df974e97ccaeceeaeb7`; spec SHA-256 `10b77c03278bdd3763c2a2584d57882df2fc7d47a4eafb1505aa9f03ba76a60e`. Recheck if production source/exports change after this QA.

Read README, AGENTS, orchestration/state, WORKLOG rules/current entry, scope, design specification/decisions/review contract, renderer/tests, semantic NWS normalizer, frame pack tests, `docs/t24-rebaseline.md`, and current `docs/t24-review.md`. Fetched the full current Notion T24 card read-only: In progress, technical dependency T11, stage7, acceptance/release criteria retained. No Notion, production source, exports, Git, firmware, WORKLOG, deployment, or device mutations were performed by QA. Testing used `/private/tmp/weather-epaper-t24-independent-qa`, an isolated copied snapshot, with accepted-base PNGs extracted directly using `git show` rather than trusting the implementer’s saved before files.

No new panel observation, hardware acceptance, production release, scheduler reliability claim, T16 acceptance, merge, or deployment approval is inferred from software checks.

## Acceptance table

| Criterion | Result | Independently verified evidence |
|---|---|---|
| Three daily rows display low/high in normal and low battery | Pass | One canonical renderer expression changes from `${slot.high}°/${slot.low}°` to `${slot.low}°/${slot.high}°`; all row labels checked by the new regression in both battery variants. Recorded-NWS integration also produced exactly `58°/81°`, `50°/71°`, `48°/73°` for Sun/Mon/Tue in both variants. |
| Signed, equal and widest fixture values fit; degree/slash formatting consistent | Pass | Pinned design tests 4/4. New regression covers six explicit labels, all three row centers, both battery settings, equal values, positive three-digit values, negatives, and deliberately inverted field values to detect sorting. Wider 600px isolated rasters detect overflow and require complete visible ink inside each actual frame; bounds and visible centers remain checked. Native before/after winter and widths, plus thresholded widths 3×, visually inspected: no clipping, displaced anchor, or chance-line collision. |
| Semantic high/low/date/day/night pairing preserved | Pass | `server/src/normalize.js` unchanged; high comes from daytime date match, low from the night whose start equals that daytime’s end. Independent scratch semantic test uses actual recorded NWS data with explicit expected values/dates for all three days, reverses period order, checks both battery variants and input immutability, and confirms missing Sunday Night fails instead of substituting another night. Server tests 359/359, including calendar/DST and fail-closed paths. |
| Source, specification, decisions, review instructions, exports agree; setup unchanged; bounded pixels | Pass | Current contract/review/decision/scope wording agrees with low/high renderer. Seven independent rebuilt PNGs equal proposed references byte-for-byte; setup PNG and 3× preview byte-identical to accepted base; all 96 icon assets byte-identical. Independently counted every old/new pixel and required all changed pixels inside x303..395 and y111..137/163..189/215..241; every weather frame has changes in all three rows. New repository mask checker independently executed and passed. |
| Pinned build PASS; seven comparisons; six CLI comparisons; green CI | Pass for local software; Pending for review-head CI | Independent pinned `./build.sh` prints PASS with mode1 400×300, 4px margins, 96 icons, 53 review references, visible centers, ≥5px hourly gap. Seven `tools/framediff.py` zero results plus byte checks; actual server CLI six fixtures each zero framediff and `cmp` zero. Existing framediff tool unit tests 6/6. Exact final review-head CI is owned by orchestrator after commit. |
| Independent QA, Jeremy acceptance/re-baseline, authorized merge recorded | Independent QA Pass; human/release gates Pending | This report supplies independent QA. Review packet presents all seven before/after references, pinned evidence and pending review/release gates. Jeremy acceptance/re-baseline and merge authorization have not been supplied. Deployment remains separately gated. |

## Reproduction

Image key derived independently from current locked inputs using the same Git hashing algorithm as `tools/render.sh`: `weather-epaper-render:5830ef899537`. Docker daemon29.4.0; pinned image uses Node22.23.3. QA’s first read-only design-test mount failed on the renderer’s generated `.build/fonts.conf` initialization; rerunning with the isolated scratch writable passed. This was a test-harness permission error, not a product failure. Production remained unmounted or read-only.

These are the exact successful container commands (working directory is the QA scratch directory):

```sh
docker run --rm --user 501:20 --volume /private/tmp/weather-epaper-t24-independent-qa:/work --tmpfs /work/design/node_modules --workdir /work weather-epaper-render:5830ef899537 ./build.sh
docker run --rm --user 501:20 --volume /private/tmp/weather-epaper-t24-independent-qa:/work --tmpfs /work/design/node_modules --workdir /work weather-epaper-render:5830ef899537 node --test design/test
docker run --rm --user 501:20 --volume /private/tmp/weather-epaper-t24-independent-qa:/work --tmpfs /work/design/node_modules --workdir /work/server weather-epaper-render:5830ef899537 npm test
docker run --rm --user 501:20 --volume /private/tmp/weather-epaper-t24-independent-qa:/work:ro --volume /Users/jeremyward/.codex/worktrees/t24-daily-low-high/weather-epaper:/source:ro --tmpfs /work/design/node_modules --workdir /work weather-epaper-render:5830ef899537 python3 qa-compare.py
docker run --rm --user 501:20 --volume /private/tmp/weather-epaper-t24-independent-qa:/work --tmpfs /work/design/node_modules --workdir /work weather-epaper-render:5830ef899537 python3 qa-cli.py
docker run --rm --user 501:20 --volume /private/tmp/weather-epaper-t24-independent-qa:/work --tmpfs /work/design/node_modules --workdir /work weather-epaper-render:5830ef899537 node qa-semantics.mjs
docker run --rm --user 501:20 --volume /private/tmp/weather-epaper-t24-independent-qa:/work:ro --tmpfs /work/design/node_modules --workdir /work weather-epaper-render:5830ef899537 python3 -m unittest discover -s tools -p 'test_*.py'
docker run --rm --user 501:20 --volume /private/tmp/weather-epaper-t24-independent-qa:/work:ro --tmpfs /work/design/node_modules --workdir /work weather-epaper-render:5830ef899537 python3 design/test/check-t24-rebaseline.py qa-base
```

`qa-compare.py`, `qa-cli.py`, and `qa-semantics.mjs` remain in scratch for reproduction. The six CLI check ran the actual `node server/bin/render.js --fixture ... --out ...` path, adding `--low-battery` for the sixth case, followed by `tools/framediff.py` and system `cmp`; it is equivalent to the six substantive comparisons in `tools/fixture-check.sh` without needing a writable/shared Git checkout in QA scratch. No old/new nonzero count is presented as a new/new match. Before the orchestrator commits the proposed references, `tools/render.sh`’s comparison against old HEAD is expected to fail; after commit required CI must show seven zero rows against that review head.

## Independently counted old/new pixels

| Frame | Total changed | Changed per daily row | Outside masks | New/new |
|---|---:|---|---:|---|
| summer | 931 | 274 /353 /304 | 0 | 0; byte-identical |
| winter | 1046 | 350 /366 /330 | 0 | 0; byte-identical |
| spring | 611 | 232 /188 /191 | 0 | 0; byte-identical |
| widths | 956 | 307 /265 /384 | 0 | 0; byte-identical |
| night | 611 | 213 /221 /177 | 0 | 0; byte-identical |
| setup | 0 | 0 /0 /0 | 0 | 0; byte-identical to both base and proposal |
| low battery | 611 | 213 /221 /177 | 0 | 0; byte-identical |

All seven regenerated SHA-256 values match `docs/t24-rebaseline.md`. `git diff --check` on the implementation checkout passed. Existing pack acceptance tests round-trip all seven canonical PNGs through 15,000-byte raw framebuffers and `tools/framediff.py`, with polarity/bit-order checks; no wire-format source change was made.

## Remaining gate

Orchestrator should attach this independent QA evidence, commit the reviewed content, obtain green required CI on the final head, and stop for Jeremy’s concrete T24 reference acceptance/merge decision. No further implementation task or hardware operation is authorized by this QA verdict.
