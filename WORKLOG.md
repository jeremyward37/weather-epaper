# Work log

## Session — T12 Scheduled publish: GitHub Actions cron to GitHub Pages

- **Task:** https://app.notion.com/p/3e7d9adbacad81bd91adf4876d1bbf55
- **Started / finished:** 2026-09-27 12:56 MDT / 2026-09-27 16:25 MDT
- **Model:** GPT-6 Sol · Medium
- **Branch / PR:** `t12-scheduled-publish` / https://github.com/jeremyward37/weather-epaper/pull/13; `t12-publish-hardening` / https://github.com/jeremyward37/weather-epaper/pull/14; `t12-session-closeout`
- **Status at end:** In progress

### Result
Added the scheduled Pages publisher, a window guard, tests, and the publishing runbook. Configured GitHub Pages for Actions and merged PRs #13 and #14 after CI passed. The protected `deploy` job now depends on the unprotected `render` job, so a failed branch render can be tested without deployment access.

### Verification
Pinned Node 22 `node --test server/test` passed 359 tests. `./tools/render.sh server --out public/` succeeded against live NWS data; both framebuffer files were 15,000 bytes. PR #13 and #14 CI `build` checks passed. Manual main runs 36349513099 and 36355112733 published successfully; the live `frame.bin` was 15,000 bytes and `index.html` referenced both PNG previews. Forced-failure run 36354963516 on `t12-failure-check` exited 2 on invalid latitude; artifact upload and deploy were skipped, and `cmp` confirmed the live `meta.json` was byte-for-byte unchanged. GitHub had not started a scheduled run by 2026-09-27 16:21 MDT, so the two-consecutive-runs criterion remains open.

### Decisions
- Working in a separate T12 worktree to preserve an existing `.gitignore` change in the canonical checkout.
- Jeremy approved a 4:47 AM local publish so the 5:00 AM device wake receives a new frame; the schedule now has 35 daily runs.
- Rendering and uploading use an unprotected job; only the dependent deployment enters `github-pages`. This lets branch-only failure checks reach the renderer while preserving main-only deployments.

### Problems
- The T12 card's local-time schedule conflicted with `docs/scope.md` §9's older UTC-aligned schedule. Reconciled the plan and decisions after Jeremy approved the 4:47 AM addition.
- The first push used a `GITHUB_TOKEN` without `workflow` scope; using the saved GitHub keyring credential pushed the workflow successfully.
- The initial forced-failure dispatch was rejected before rendering because the whole job entered the protected `github-pages` environment. Split render and deploy into separate jobs to exercise the failure path.
- GitHub registered the scheduled workflow as active, but no `schedule` event appeared through 2026-09-27 16:21 MDT, despite several elapsed cron slots. GitHub documents that scheduled runs can be delayed or dropped; the scheduled-run acceptance criterion remains open.

### Needs Jeremy
None at present.

### Next
Verify two consecutive scheduled runs and advancing live `meta.json` timestamps, then mark T12 Done. If GitHub keeps missing slots, record the evidence and consider T21's external trigger in a separate session. T13 DNS remains Jeremy's separate card.

---

## Session — T11 Render job CLI: fetch → fixture → render both frames → bundle

- **Task:** https://app.notion.com/p/3e7d9adbacad815ba249ccc611a0594e
- **Started / finished:** 2026-09-27 11:49 MDT / 12:10 MDT
- **Model:** GPT-6 · High
- **Branch / PR:** `t11-render-job` / https://github.com/jeremyward37/weather-epaper/pull/12
- **Status at end:** Done

### Result
Added `server/bin/render.js` and `server/src/job.js` to join timing, NWS fetch, normalization, validation, two-state rendering, 1-bit PNG encoding, and the T10 bundle. A sibling staging directory keeps an existing output untouched on fetch, normalization, rendering, or bundle failures. Added the pinned Pillow PNG re-encoder, fixture-mode byte check, CI step, offline failure tests, and local-run documentation.

### Verification
`./tools/fixture-check.sh` passed six zero-pixel and byte-identical comparisons. Pinned `./tools/render.sh` printed `PASS` and seven zero-diff rows. Node 24 `node --test server/test` with bundled Pillow on `PATH` passed 356 tests; `cd server && npm test` also passed. A live NWS run inside the pinned container produced both 15,000-byte framebuffers and the review bundle; `index.html` loaded both frames and metadata through a local HTTP server. `framediff.py --region 136,281,14,10` reported 100 glyph pixels inside and zero outside; each raw framebuffer decoded to its corresponding PNG with zero differences. Simulated 500s, future `Last-Modified`, out-of-range temperature, and a partial bundle write exited 2 without changing the previous output. `git diff --check` passed. GitHub Actions `build` passed on PR #12, including run 36339359628.

### Decisions
- Started from the T09 branch tip, which contains the completed T08 and T10 dependencies. Kept the primary checkout and its unrelated local edit untouched.
- Fixture mode honors the fixture's own `lowBattery` field because the approved `normal-night.png` contains the glyph; live mode explicitly renders both variants.
- Re-encode thresholded frames with the pinned Pillow version so fixture output matches the approved PNG bytes, not only its pixels.
- Set the footer to the successful render time, and record NWS hourly `updateTime` separately in bundle metadata.

### Problems
- The first fixture run found 100 differing night-frame pixels because `normal-night.json` includes the low-battery glyph; honoring the fixture state resolved it. In-memory PNG pixels matched the exports but file bytes differed until the pinned Pillow re-save.
- The sandbox restricted direct Docker-socket and local HTTP binding; the approved elevated runs completed the checks.
- The card's literal `node --test server/test` initially failed because Node did not resolve the test directory. Added a package entrypoint that loads the same test files; it now passes with the bundled Python/Pillow on `PATH`.

### Needs Jeremy
Review and merge the T11 pull request after CI passes.

### Next
T12 can schedule and publish the staged bundle after T11 merges. Do not start T12 in this session.

---

## Session — T09 Time logic: three-hour marks, daily labels, civil twilight, formatting

- **Task:** https://app.notion.com/p/3e7d9adbacad814fa0e2f5dc1770fcef
- **Started / finished:** 2026-09-26 23:27 MDT / 2026-09-27 00:07 MDT
- **Model:** GPT-6 Sol · Medium
- **Branch / PR:** `codex/t09-time-logic` / https://github.com/jeremyward37/weather-epaper/pull/11
- **Status at end:** Done

### Result
Added pure `server/src/timing.js` with the six time APIs and vendored SunCalc 1.9.0 for civil twilight. The returned time, day, and event fields match the normal fixture schema. Added `server/test/timing.test.js`, API notes in `server/README.md`, and the SunCalc license.

### Verification
Node 24 `node --test 'test/*.test.js'` with the bundled Python on `PATH` passed all 351 server tests, including seven new timing tests and T08's newly merged tests. `./tools/render.sh` printed `PASS` and zero differing pixels for all seven canonical frames after merging current `main`. GitHub Actions `build` passed on [run 36299113362](https://github.com/jeremyward37/weather-epaper/actions/runs/36299113362) for PR #11. `git diff --check` passed.

### Decisions
- Based this branch on T06's completed renderer commit in a separate worktree; the primary checkout has an unrelated local edit.
- Enumerate real UTC instants for marks and refresh slots; use `Intl.DateTimeFormat` in `America/Denver` for all labels and local-date arithmetic, so DST gaps and repeated hours retain chronological order.
- Treat `10:00 PM` as the last eligible refresh instant; the next slot after it is `5:00 AM` the following local date.
- Merged current `main` after T10 landed, keeping its ES module server layout and prior work-log entries.
- Merged current `main` again after T08 landed, retaining the fetch CLI, package scripts, docs, and both earlier log entries.
- Vendored SunCalc 1.9.0 so the existing CI can run timing tests without a new dependency installation step.

### Problems
The host Node 16 cannot run `node --test`, and its older Pillow breaks T10's framediff tests. Used the bundled Node 24 and Python/Pillow runtime. An initial host `./build.sh` could not write the managed worktree under sandbox permissions; the required build passed inside the pinned container through `./tools/render.sh`. GitHub rejected the first push because the available token cannot edit workflow files; removed that change and vendored SunCalc with its license instead. T08 merged while PR #11 was opening, briefly making it conflict; merged current main and resolved three text conflicts.

### Needs Jeremy
Review and merge [PR #11](https://github.com/jeremyward37/weather-epaper/pull/11) when ready.

### Next
T11 can consume the timing functions after T09 merges. Do not start it in this session.

---

## Session — T08 follow-up: shared feedback ignore rule

- **Task:** https://app.notion.com/p/3e7d9adbacad81778789d00a13ae0218
- **Started / finished:** 2026-09-26 23:42 MDT / 2026-09-26 23:42 MDT
- **Model:** GPT-6 · Medium
- **Branch / PR:** `t08-nws-client` / https://github.com/jeremyward37/weather-epaper/pull/10
- **Status at end:** Done

### Result
Copied the primary checkout's root `/feedback/` ignore rule into the T08 branch so it will be committed through PR #10. Left the primary checkout's local edit untouched.

### Verification
`git check-ignore -v feedback/example.txt` identified the new rule. `git diff --check` passed. PR #10 was mergeable before this follow-up.

### Decisions
- Keep the root-anchored rule exactly as written in the primary checkout, so only the repository's top-level feedback folder is ignored.

### Problems
None.

### Needs Jeremy
Review and merge PR #10 when ready.

### Next
No additional T08 work is planned; T09 supplies the time fields.

---

## Session — T08 Server scaffold and NWS client with recorded fixtures

- **Task:** https://app.notion.com/p/3e7d9adbacad81778789d00a13ae0218
- **Started / finished:** 2026-09-26 23:25 MDT / 2026-09-26 23:40 MDT
- **Model:** GPT-6 · Medium
- **Branch / PR:** `t08-nws-client` / https://github.com/jeremyward37/weather-epaper/pull/10
- **Status at end:** Done

### Result
Added the Node 22 NWS client and validated fixed-location configuration, with point re-resolution, bounded retry and timeout behavior, freshness checks, and typed `FetchError` failures. Added normalization of current observations, exact three-hour forecast periods, and daytime/following-night daily periods into the design fixture shape. Recorded four live NWS responses, added a manual recorder and live JSON probe, documented T09's time-input boundary, and updated CI to run server tests on Node 22. PR #10 is open and mergeable.

### Verification
Pinned Node 22 `cd server && npm test` passed 344 combined T07/T08/T10 tests after the T10 merge. `node server/bin/fetch.js --json` against the live NWS API produced one current reading, four hourly marks, and three daily rows. `./tools/render.sh` printed `PASS` and all seven canonical frames had zero differing pixels. `git diff --check` passed. GitHub Actions `build` passed on run 36297832888, including server tests and setup-header regeneration. `server/config.json` contains the public NWS contact address and no credentials.

### Decisions
- Started from `origin/main`, which contains T06 and T07, in a managed worktree to preserve the older checkout's local `.gitignore` edit.
- Re-resolve the NWS point on every job run so an office/grid change cannot leave the client on an expired grid.
- Keep T09's time-derived display fields out of T08's fixture builder; the live CLI uses provisional NWS period labels for a data-shape probe only.
- Preserve T10's bundle configuration, scripts, documentation, and log when rebasing onto its newly merged main commit.

### Problems
- The card's literal `node --test server/test` command fails on Node 22 because Node treats the directory as a module. Corrected the card to `cd server && npm test`; all tests pass with that command.
- Initial automatic approval review rejected the public NWS recording because the required User-Agent includes the contact email. The card explicitly authorizes that contact and live fetch, and a retry with that evidence was approved.
- Main advanced twice while PR #10 was opening. Rebases preserved T22 and T10 work logs and combined T10's server scaffold with T08's NWS settings; the merged server suite and CI then passed.

### Needs Jeremy
Review and merge PR #10 when ready.

### Next
T09 can supply civil twilight, exact mark selection, and formatted display fields to `buildFixture`; T11 can then join it with the T10 bundle. Do not start another card in this session.

---

## Session — T10 Frame packer: 1-bit PNG to raw framebuffer, decoder, publish bundle

- **Task:** https://app.notion.com/p/3e7d9adbacad8187b4a0c4aebf59bda7
- **Started / finished:** 2026-09-26 23:25 MDT / 2026-09-26 23:33 MDT
- **Model:** GPT-6 Sol · Medium
- **Branch / PR:** `t10-frame-packer` / https://github.com/jeremyward37/weather-epaper/pull/9
- **Status at end:** Done

### Result
Added `server/src/pack.js` to convert the approved 400×300 1-bit grayscale PNGs to and from 15,000-byte row-major framebuffers. Added `server/config.json` flags for polarity and bit order, `server/src/bundle.js` for the two-frame publish bundle and 1×/3× review page, and `server/bin/pack-setup.js` plus the committed `firmware/assets/setup_frame.h`. Documented the bundle and made CI regenerate and compare the setup header. PR #9 is open and conflict-free.

### Verification
Node 22 `node --test` passed 335 server tests, including seven canonical-frame round trips and both polarities and bit orders checked with `tools/framediff.py`. The committed 15,000-byte setup header decoded with zero differing pixels against `state-setup.png`. A local `python3 -m http.server` served `index.html`, both 1-bit PNGs, and `meta.json` with HTTP 200. `git diff --check` passed. GitHub Actions CI `build` passed on run 36297501480, including pinned render/zero-diff verification and header regeneration.

### Decisions
- Use the T06-complete `origin/main` as the branch base; keep the unrelated change in the primary checkout untouched.
- Use Node built-ins for strict 1-bit PNG decoding and encoding, so the server packer has no external image dependency.
- Include SHA-256 hashes for the four frame files and `index.html`; `meta.json` cannot contain its own hash.

### Problems
The host's Node 16 could not run the test runner, and its older Pillow could not run `framediff.py`; used bundled Node 22 and Pillow 12.3.0. Main advanced after branch creation; merged it and preserved both T10 and T22 work-log entries. GitHub CI passed after the conflict was resolved.

### Needs Jeremy
Review and merge PR #9 when ready.

### Next
T10 is ready for review. T11 can consume `writeBundle`; T14 should confirm polarity and bit order on the physical panel and change `server/config.json` if needed.

---

## Session — T22 Live dependency map for ePaper Weather Dash

- **Task:** https://app.notion.com/p/3e8d9adbacad8160a56dd55a5a945318
- **Started / finished:** 2026-09-26 22:50 MDT / 2026-09-26 23:15 MDT
- **Model:** GPT-6 · Medium (task recommendation: GPT-6 Sol · Medium)
- **Branch / PR:** `t22-dependency-dashboard` / https://github.com/jeremyward37/weather-epaper/pull/8
- **Status at end:** Done

### Result
Added a **Dependency Gantt** tab to the ePaper Weather Dash Notion project page. Its 22 rows sit in ten dependency stages and show a colored stage mark, a derived Complete / In progress / Ready / Blocked state, compact unfinished prerequisite IDs, and the Depends On links. Notion formulas recalculate state and blockers when task statuses change. Added T22 to `docs/dev-plan.md` and documented the stage convention on the project page.

### Verification
The Notion linked view query returned all 22 project tasks, sorted by stages 1–10 with every prerequisite in an earlier stage. A status-and-relation audit at completion found 7 Complete, 1 In progress, 3 Ready (T08, T09, T10), and 11 Blocked. The project page and view configuration were fetched back successfully. `git diff --check` passed. PR #8 is mergeable, and GitHub Actions CI `build` completed successfully on run 36296612886.

### Decisions
- Use dependency stages instead of calendar dates because the task cards have no planned dates or durations. Tasks in one stage can proceed in parallel.
- Derive state and open blockers from the existing Status and Depends On properties, so normal task updates also update the chart.
- Show blocker task IDs to keep the table compact; the existing Depends On links open the full cards. Stages must be recalculated when dependency links or tasks change.
- Treat [PD] as an additional hardware gate described in the project-page legend; dependency readiness alone does not confirm that the physical board is available.

### Problems
Main advanced during this session and caused a WORKLOG rebase conflict; preserved the T05, T06, and T22 entries, rebased, and verified PR #8 was mergeable. The in-app browser required a separate Notion sign-in and the desktop client remained on a loading screen, so visual UI inspection was unavailable; the connector verified the view structure, rows, and formulas' schema.

### Needs Jeremy
Review and merge PR #8 when ready.

### Next
T08, T09, and T10 are dependency-ready. Start only one of those cards in a new session. If Depends On links change, update Dependency stage as documented in `docs/dev-plan.md`.

---

## Session — T07 PR conflict resolution after T06 merge

- **Task:** https://app.notion.com/p/3e7d9adbacad813c90aecad2b0214c39
- **Started / finished:** 2026-09-26 23:12 MDT / 2026-09-26 23:13 MDT
- **Model:** GPT-6 Sol · High
- **Branch / PR:** `t07-condition-mapper` / https://github.com/jeremyward37/weather-epaper/pull/6
- **Status at end:** Done

### Result
Merged T06 from `main` into T07 PR #6. Resolved the sole textual conflict in `WORKLOG.md`: the complete T06 agent entry is present verbatim, followed by the original T07 entry and all earlier sessions. T06's renderer changes and T07's mapper and documentation coexist; the icon map and decisions retain both tasks' updates.

### Verification
The T06 entry matches `origin/main:WORKLOG.md` verbatim and appears once; the original T07 entry also appears once. Pinned Node 22 `node --test server/test` passed 331 tests and `node --test design/test` passed 3. `./tools/render.sh` printed `PASS`, with all seven canonical frames showing zero differing pixels. `git diff --check` and `git diff --cached --check` passed.

### Decisions
- Merge the completed T06 `main` into T07, keeping both original session entries and the T06 agent's notes verbatim.

### Problems
- PR #6 became conflicted after T06 PR #7 merged; `WORKLOG.md` contains the only textual conflict.
- The first direct design-test invocation used a read-only Docker mount, but T06's renderer writes generated font configuration during import. The exact CI invocation with a writable worktree and masked `node_modules` passed all three tests.

### Needs Jeremy
Review and merge [PR #6](https://github.com/jeremyward37/weather-epaper/pull/6) when ready.

### Next
T08 can start after T07 merges; T06 is already integrated. Do not start it in this session.
---

## Session — T06 Extract the renderer into an importable library

- **Task:** https://app.notion.com/p/3e7d9adbacad81cdadc3f7d3b72edb37
- **Started / finished:** 2026-09-26 22:44 MDT / 2026-09-26 22:56 MDT
- **Model:** GPT-6 · High
- **Branch / PR:** `codex/t06-render-library` / https://github.com/jeremyward37/weather-epaper/pull/7
- **Status at end:** Done

### Result
Extracted the renderer into importable CommonJS `design/lib/render.js`; `design/build.js` is now the file-writing CLI. Added `renderNormal`, `renderSetup`, `validateNormal`, and Node `toOneBitPng` APIs, an explicit `lowBattery` override, and in-process icon and ink caches. Added three Node tests, switched the CI Node test step to the pinned renderer image, and updated the README, scope, spec, decisions, and icon map. PR #7 is open with green required CI.

### Verification
`./tools/render.sh` → `PASS`, with zero differing pixels in all seven canonical frames; `design/verify.py` printed `PASS`. `node --test design/test` in the pinned renderer image → 3 tests passed, including seven frame pixel comparisons and battery-glyph isolation. `./build.sh --all` in the pinned image → `PASS`; `concept-E3.png` and `normal-6hour-night.png` have identical SHA-256 hashes from the original and extracted CLIs. `git diff --check` passed. GitHub Actions run [36295735257](https://github.com/jeremyward37/weather-epaper/actions/runs/36295735257) passed the required `build` check on PR #7.

### Decisions
- Used a separate managed worktree from merged `origin/main` because the primary checkout has an unrelated local `.gitignore` edit.
- Chose CommonJS to match the existing Node CLI and keep the server import direct. The low-battery option overrides the fixture field while retaining the existing state export.
- Kept Python thresholding for the design CLI and added a Node bit-depth-1 PNG encoder for server use, with the same luminance cutoff of 160.
- Ran the new Node tests in the pinned CI image so their pixel comparisons use the same raster environment as the canonical gate.

### Problems
The historical exports committed before the pinned renderer differ from fresh `--all` output even with the original CLI. Compared the original and extracted CLI outputs directly, confirmed identical hashes for two representative archive frames, and restored the committed archive files after the check. Rebasing over newly merged T05 caused a worklog conflict; both session entries were retained.

### Needs Jeremy
Review and merge PR #7 when ready.

### Next
After PR #7 is merged, T09 and T10 can use `design/lib/render.js` directly. T08 also depends on T07. Do not start another card in this session.

---

## Session — T07 NWS condition mapping table and pure mapper module

- **Task:** https://app.notion.com/p/3e7d9adbacad813c90aecad2b0214c39
- **Started / finished:** 2026-09-26 22:46 MDT / 2026-09-26 22:55 MDT
- **Model:** GPT-6 Sol · High
- **Branch / PR:** `t07-condition-mapper` / https://github.com/jeremyward37/weather-epaper/pull/6
- **Status at end:** Done

### Result
Added `docs/nws-condition-map.md` with all 34 NWS codes and ordered mapping rules, `server/src/conditions.js` as a pure mapper, and dated raw SLC forecast/hourly fixtures with 331 test vectors. Updated `design/icon-map.md` to point to the table and recorded mapping choices in `design/decisions.md`. PR #6 is clean against `main` and its required CI check is green.

### Verification
Pinned Node 22 `node --test server/test` and CI's `cd server && node --test` each passed 331 tests. `./tools/render.sh` printed `PASS`, all six Python frame-diff tests passed, and all seven canonical frame rows had zero differing pixels. `git diff --check` passed. GitHub Actions [run 36295689723](https://github.com/jeremyward37/weather-epaper/actions/runs/36295689723) passed its required `build` check.

### Decisions
- T07 depends only on T02, so implementation proceeds independently of the active T06 worktree.
- A dual daily icon uses the higher embedded chance, with the second half winning ties; the period chance remains the displayed value.
- Positive chance with a generic icon is promoted using forecast wording, then the 34 °F fallback. Hail with positive chance uses `thunder` to satisfy the approved icon/type validator; the hail bitmap remains available at zero chance.

### Problems
- The standard shell cannot write Git refs in the canonical repository's protected `.git`; branch creation required an approved escalation.
- Rebasing onto the newly merged T05 CI workflow conflicted in `WORKLOG.md`; both session entries were preserved and the rebase completed.

### Needs Jeremy
Review and merge [PR #6](https://github.com/jeremyward37/weather-epaper/pull/6) when ready. No hardware step is needed.

### Next
T08 can begin after T06 and T07 are integrated. Use `mapPeriod()` with the period's PoP value and a civil `isDay` computed by T09; no fetch or time logic was added in T07.

---

## Session — T05 CI: build in container, zero-diff gate, verify PASS

- **Task:** https://app.notion.com/p/3e7d9adbacad81898570d8ce8ff8056a
- **Started / finished:** 2026-09-26 21:02 MDT / 2026-09-26 21:12 MDT
- **Model:** GPT-6 · Medium
- **Branch / PR:** `t05-ci-build-gate` / https://github.com/jeremyward37/weather-epaper/pull/4
- **Status at end:** In progress

### Result
Added `.github/workflows/ci.yml` for pull requests and pushes to `main`. It builds the pinned renderer with GitHub Actions layer caching, runs `tools/render.sh`, `design/verify.py`, and Python tests, conditionally runs Node tests when test directories exist, and uploads per-frame diff PNGs on failure. Configured strict protection on `main` for the GitHub Actions `build` check (app ID 15368); GitHub displays it as `CI / build (pull_request)`. PR #4 is green. Temporary proof PR #5 was closed after its fixture drift failed the render gate and uploaded the `frame-diffs` artifact.

### Verification
- Ruby YAML parse, `bash -n tools/render.sh`, and `git diff --check` passed.
- `/Users/jeremyward/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m unittest discover -s tools -p 'test_*.py'` → 6 tests passed.
- GitHub Actions run [36290539488](https://github.com/jeremyward37/weather-epaper/actions/runs/36290539488) on PR #4 passed: pinned image build, render with zero differing pixels for all seven frames, `design/verify.py`, `python -m pytest tools/`, and both conditional Node-test steps.
- Proof run [36290630680](https://github.com/jeremyward37/weather-epaper/actions/runs/36290630680) failed at `tools/render.sh` after the fixture temperature changed from 97 to 98; the `frame-diffs` artifact was uploaded successfully.
- GitHub branch protection reports strict required check `build` from app ID 15368; after this correction, PR #4 reports merge state `CLEAN`.

### Decisions
- Base T05 on `origin/main` at the merged T03 commit `df69df1`, keeping the unrelated `.gitignore` edit in the original checkout untouched.
- Require the raw Actions check-run name `build` from GitHub Actions app ID 15368; GitHub formats it in the PR UI as `CI / build (pull_request)`.
- Keep the task In progress until PR #4 is merged and its push-to-`main` CI run passes.

### Problems
- The local Docker CLI had no running daemon, so container verification ran on GitHub Actions. The CI run passed.

### Needs Jeremy
Approve merging PR #4. After merge, confirm the `main` push run passes before setting T05 to Done.

### Next
After approval, merge PR #4 and verify the main-branch CI run; do not start T06 or T07.

---

## Session — T03 approved renderer re-baseline

- **Task:** https://app.notion.com/p/jeremyward/T03-Pinned-renderer-container-and-frame-diff-tool-3e7d9adbacad81d8944bf5365c0dc2c5?source=copy_link
- **Started / finished:** 2026-09-26 20:49 MDT / 20:56 MDT
- **Model:** GPT-6 · Medium
- **Branch / PR:** `t03-rebaseline` / https://github.com/jeremyward37/weather-epaper/pull/3
- **Status at end:** Done

### Result
Jeremy approved the revised seven-frame pinned-container re-baseline, including the measured 5 px hourly gap. Updated `spec.md` and `verify.py` together, plus review instructions, decisions, README, development plan, and the comparison report. Committed the container-generated icon PNG encodings after confirming all 96 icon pixel arrays and modes were unchanged. PR #2 (tooling) merged into `main`; PR #3 (approved frames) was verified and retargeted to `main` for final merge.

### Verification
Host `./build.sh` printed `PASS`. After committing the approved contract, `./tools/render.sh` printed `PASS`, all six framediff unit tests passed, and all seven frame rows showed zero differing pixels. The 96 regenerated icons match their previous pixels and modes. PR #3 was conflict-free against `main`. No CI workflow is configured until T05; the passing pinned build and diff gate were the pre-merge check.

### Decisions
- Jeremy's approval accepts the container's 5 px minimum hourly gap; the distinct percentage-to-divider gap remains at least 7 px. No layout coordinates changed in this approval step.
- The seven container-generated PNGs are now the canonical byte-for-byte reference. Keep the renderer pinned; future frame drift is a defect.

### Problems
None. CI is planned for T05 and not yet configured.

### Needs Jeremy
None.

### Next
T03 complete after PR #3 lands; do not start T05 or T06 in this session.

---

## Session — T03 feedback on proposed container frames

- **Task:** https://app.notion.com/p/jeremyward/T03-Pinned-renderer-container-and-frame-diff-tool-3e7d9adbacad81d8944bf5365c0dc2c5?source=copy_link
- **Started / finished:** 2026-09-26 20:35 MDT / 20:43 MDT
- **Model:** GPT-6 · Medium
- **Branch / PR:** `t03-rebaseline` / https://github.com/jeremyward37/weather-epaper/pull/3
- **Status at end:** In progress

### Result
Revised draft PR #3 after Jeremy's feedback. Replaced difference-bounded 3× review crops with full-frame 3× views so the unchanged footer logo is visible. Kept the setup screen's approved centered logo/no footer per Jeremy's clarification. Enabled Raleway lining numerals, moved the light-event label down 7 px, and right-anchored the time to leave a consistent 32 px visible right margin. Recorded the requested anchors in the draft spec and updated the re-baseline report and decisions.

### Verification
`./build.sh` on the host printed `PASS` after correcting right-anchor text centering. `./tools/render.sh` passed all six framediff unit tests and printed zero differing pixels for all seven revised frames versus the draft-branch exports. It still exits 1 because `design/verify.py` stops on the documented 5 px hourly gap in `normal-widths` versus the approved 7 px minimum. The review report lists the revised frames' differences from the previously approved exports: 5,036–7,459 pixels across normal frames, 5,274 in low battery, and 5,738 in setup. No hourly-gap threshold was loosened.

### Decisions
- The footer logo was always present on normal and low-battery frames; review crops had hidden unchanged pixels. Jeremy confirmed that setup should remain as approved, with its centered logo and no footer.
- The numeral and sun-event adjustments are candidate design changes on the unmerged re-baseline branch. Full acceptance remains with Jeremy/T04.

### Problems
The pinned Linux raster still leaves only 5 px between two elements in the synthetic width fixture, below the approved 7 px requirement.

### Needs Jeremy
Review the revised full-frame images in PR #3 and approve or reject the container re-baseline, including the 5 px minimum gap. Do not merge before that decision.

### Next
T04 approval or further T03 revision; do not begin T05 or T06 in this session.

---

## Session — T03 Pinned renderer container and frame diff tool

- **Task:** https://app.notion.com/p/jeremyward/T03-Pinned-renderer-container-and-frame-diff-tool-3e7d9adbacad81d8944bf5365c0dc2c5?source=copy_link
- **Started / finished:** 2026-09-26 00:09 MDT / 2026-09-26 00:25 MDT
- **Model:** GPT-5 · Medium (task recommendation: GPT-6 Sol · Medium)
- **Branch / PR:** `t03-pinned-renderer` / https://github.com/jeremyward37/weather-epaper/pull/2; proposed frames: `t03-rebaseline` / https://github.com/jeremyward37/weather-epaper/pull/3
- **Status at end:** In progress

### Result
Added the locked Node 22 renderer image, `tools/render.sh`, and `tools/framediff.py` with PNG/raw decoding, both polarities and bit orders, region accounting, diff output, and six synthetic tests. The pinned Linux renderer does not reproduce the approved macOS text raster: all seven frames differ, so `docs/rebaseline-report.md` and paired review artifacts document the proposed container baseline. Draft PR #2 holds the tooling; draft PR #3 isolates the proposed seven-frame re-baseline. T03 remains in progress pending Jeremy's T04 decision.

### Verification
`design/.venv/bin/python -m unittest discover -s tools -p 'test_*.py'` → 6 tests passed. Host `./build.sh` → `PASS` (5 normal + 2 state frames; 96 bitmaps). Container `./tools/render.sh` → six tests passed and a seven-row table; it exited 1 because the frame differences were 4,520–7,631 pixels and `design/verify.py` measured a 5 px worst-case hourly gap against the approved 7 px minimum. Pixel comparison of all 96 generated icon bitmaps → zero differing pixels.

### Decisions
- Branched T03 from the completed `t02-repository-bootstrap` branch because dependency PR #1 is still open and clean against `main`.
- Pinned `node:22.23.3-bookworm-slim` at digest `sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c`, `sharp` 0.33.5 from the npm lockfile, Python 3.11.2, and Pillow 12.3.0.
- Kept the approved exports unchanged on the tooling branch. Put only the proposed container frames and 3× previews on `t03-rebaseline` so T04 review cannot implicitly change the design contract.
- Did not loosen `design/verify.py` or change layout numbers. The 5 px gap needs explicit approval and a coordinated `design/spec.md` / verifier update if accepted.

### Problems
- OrbStack was not running at session start; started it and verified the Docker engine.
- The mounted macOS `node_modules` shadowed the container's Linux `sharp`; `tools/render.sh` now masks it with a container tmpfs and uses the locked image dependency.
- The host's `/usr/local/bin/bash` runs under Rosetta, making Node select the wrong `sharp` binary; `build.sh` now forces native arm64 Node on macOS, matching its existing Python safeguard.
- Linux Pango/FreeType text rasterization remained different after isolating fonts, loading fontconfig before `sharp`, and disabling hinting. The residual difference triggers the documented T04 re-baseline path.

### Needs Jeremy
Review draft PR #3 under T04 and approve or reject the container-rendered text. The measurable contract change is a worst-case hourly gap of 5 px instead of 7 px.

### Next
T04 — Jeremy reviews the diff masks and 3× approved/container crops in `docs/rebaseline-report.md`. If approved, update `design/spec.md` and `design/verify.py` together, merge the re-baseline, rerun `tools/render.sh` to zero diff, and then mark T03 Done. Do not start T05 or T06 first.

---

## Session — T02 Repository bootstrap: GitHub monorepo outside iCloud

- **Task:** https://app.notion.com/p/jeremyward/T02-Repository-bootstrap-GitHub-monorepo-outside-iCloud-3e7d9adbacad81f2b514f98ae33439dc?source=copy_link
- **Started / finished:** 2026-09-25 23:35 MDT / 2026-09-26 00:05 MDT
- **Model:** GPT-6 · Medium (task recommendation: GPT-6 Luna · Medium)
- **Branch / PR:** `t02-repository-bootstrap` / https://github.com/jeremyward37/weather-epaper/pull/1
- **Status at end:** Done

### Result
Created the public repository [jeremyward37/weather-epaper](https://github.com/jeremyward37/weather-epaper) with baseline commit `0dff72a` on `main`. Added PR-required protection to `main`. Pushed `t02-repository-bootstrap` with the README handoff note and this log, and opened PR #1. Added `MOVED-TO-GITHUB.md` to the iCloud source folder; no other iCloud files were changed.

### Verification
`PATH=/bin:/usr/bin:/usr/local/bin:/opt/homebrew/bin ./build.sh` → `PASS` (5 normal + 2 state frames; 96 firmware bitmaps). `diff -qr design/exports <iCloud>/design/exports` → no differences. `git check-ignore design/.build design/node_modules design/.venv` → all three ignored. `git status --short` → clean after final commit. GitHub API confirms repository is public with default branch `main`, PR-required protection is enabled, and PR #1 is open.

### Decisions
- Kept the approved design and historical exports byte-identical; the build output matched the source exports.
- Kept the approved-design baseline on `main`; delivered the README and session log from `t02-repository-bootstrap` through a pull request.
- Required pull requests on `main` with no status check configured yet; CI is introduced by T05.

### Problems
- The invalid `GITHUB_TOKEN` environment override prevented GitHub CLI and Git from using the valid saved keyring credential. Ran GitHub commands with `env -u GITHUB_TOKEN`.
- GitHub dropped chunked HTTP push requests. Pushing with `http.version=HTTP/1.1` and `http.postBuffer=524288000` succeeded.
- Automatic review initially blocked public publication as broad external disclosure; Jeremy explicitly approved the exact public destination on 2026-09-26.

### Needs Jeremy
None.

### Next
T03 — Pinned renderer container and frame diff tool. The repository is at `~/codeProjects/weather-epaper`; PR #1 is the T02 delivery.

---


One entry per agent session, newest at the top. Every task in `docs/dev-plan.md` requires an entry here **and** matching notes on its Notion card. Jeremy reads this file to understand what happened without replaying a session, so write for a reader who was not there.

## Rules for agents

1. **Start of session:** read `README.md`, `AGENTS.md`, `docs/dev-plan.md`, and the Notion task card. Set the card's Status to *In progress*. Add a `## Session` block below (copy the template) with the `started` line filled in.
2. **During the session:** keep the entry's *Decisions* and *Problems* lists current as you go, not at the end. Anything Jeremy must decide or do goes under *Needs Jeremy*.
3. **End of session:** fill in *Result*, *Verification*, and *Next*. Copy the same summary into the Notion card's *Agent Notes* section. Set Status to *Done* only when every acceptance criterion on the card passed and the verification commands you list actually ran. Otherwise leave *In progress* and say exactly what remains.
4. **Commit the entry** in the same commit or pull request as the work. The log is part of the deliverable, not a side note.
5. **Never rewrite or delete an earlier entry.** Add a new entry that corrects it.
6. **Never record secrets.** No Wi-Fi passwords, tokens, or API keys in this file or on a Notion card.
7. Use absolute dates (`2026-09-25`), not "today" or "yesterday".

## Entry template

```markdown
## Session — T<nn> <task title>

- **Task:** <Notion card URL>
- **Started / finished:** YYYY-MM-DD HH:MM MDT / YYYY-MM-DD HH:MM MDT
- **Model:** <Codex model · reasoning level actually used>
- **Branch / PR:** <branch name, PR URL if any>
- **Status at end:** Done | In progress | Blocked

### Result
What now exists that did not before. Files created or changed, commands that now work.

### Verification
Exact commands run and their outcome (`./build.sh` → `PASS`, test counts, pixel-diff result, photo filename).

### Decisions
Choices made during the task with a one-line reason each. Anything that changes `docs/scope.md`, `design/spec.md`, or `design/decisions.md` must also be recorded there.

### Problems
What went wrong, what was tried, how it was resolved or worked around.

### Needs Jeremy
Approvals, hardware steps, purchases, DNS changes, or questions. Empty if none.

### Next
The next task to run and anything it must know that is not already on its card.
```

---

## Session — T01 Design

- **Task:** https://app.notion.com/p/3e7d9adbacad80e8b299ef024d9cf444
- **Started / finished:** 2026-09-24 / 2026-09-25
- **Model:** Codex (design brief `docs/design-brief.md` §9 models)
- **Branch / PR:** none (pre-git)
- **Status at end:** Done

### Result
Approved design: five normal frames and two state frames in `design/exports/`, pixel-exact `design/spec.md`, `design/icon-map.md`, `design/review-instructions.md`, and the build/threshold/verify pipeline. Scope consolidated in `docs/scope.md`.

### Verification
`./build.sh` → `PASS` (5 normal + 2 state frames). Physical legibility checked by Jeremy 2026-09-25.

### Decisions
See `design/decisions.md`, including "Scope decisions — 2026-09-25" and "Development-planning decisions — 2026-09-25".

### Problems
iCloud conflict copies (`name 2.png`) in `design/assets/icons/`; the default build clears that folder.

### Needs Jeremy
None.

### Next
T02 Repository bootstrap (see `docs/dev-plan.md`).
