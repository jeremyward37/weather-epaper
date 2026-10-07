# Development plan

**Status:** live. Written 2026-09-25 with Jeremy. This file is the index; the full instructions for each task live on its card in Jeremy's Notion **Dev Tasks** database (project: [ePaper Weather Dash](https://app.notion.com/p/3e7d9adbacad8068b42ff29eccbf8892)). Scope and decisions are in [`scope.md`](scope.md) §9; the frame contract is [`../design/spec.md`](../design/spec.md); the work log is [`../WORKLOG.md`](../WORKLOG.md).

## How a task is run

The remaining project is coordinated by a Codex orchestrator under [orchestration.md](orchestration.md), with the current gate in [orchestration-state.md](orchestration-state.md). One card per implementation run; a persistent chat may resume or coordinate later runs only after applicable approval. The orchestrator reads the card, sets In progress, opens a WORKLOG entry, delegates bounded implementation and separate QA, and prepares a `codex/tNN-slug` PR with green required CI. It then stops for Jeremy's review and hardware evidence. Agent delivery cards require every acceptance criterion, independent QA, Jeremy acceptance, and authorized merge for Done. Jeremy-only cards stay with him and close from their required evidence and acceptance.

**Progress reconciled 2026-10-07:** Notion T01–T15, T22 and T23 are Done. Jeremy accepted T15, authorized PR #20 merge and T16 start; PR #20 merged as `637c275` after green exact-head CI on accepted `6e0c57f`. T16 is In progress; T17–T21 remain Not started. T14's actual setup display, memory, USB-only ADC/buttons and T15's provisioning/reset/persistence original criteria passed independent QA and Jeremy acceptance. Jeremy will use USB power until the battery arrives in early November. T21 scheduler-delay evidence from T12 remains for its separate reliability disposition before T18 sign-off.

Token bands are historical planning estimates: Low under 300k, Med 300k–1M, High over 1M for a whole session. They are not budgets or observed usage. Re-check current account limits rather than using the old quota assumptions. Current role recommendations (checked 2026-10-07): orchestrator and independent QA GPT-6.1 Sol · High, documentation/measurement analysis GPT-6 Luna · High; GPT-6 Sol is the fallback when 6.1 Sol is unavailable. See [official models](https://learn.chatgpt.com/docs/models) and [subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents). Completed task rows retain their historical model recommendations; remaining rows below use the refreshed recommendations.

## Architecture the tasks build

```
NWS api.weather.gov ──► GitHub Actions cron (America/Denver, 4:47 AM then :17/:47, 5–9 PM)
                          runs server/bin/render.js inside the pinned render container
                          = design/lib renderer → 1-bit PNG → 15,000-byte framebuffer
                          publishes frame.bin + frame-lowbat.bin + PNGs + meta.json
                                   │  only on success; a failed fetch publishes nothing
                                   ▼
                        GitHub Pages  https://weather.builtbyjer.com/  (Namecheap CNAME)
                                   │  HTTPS GET ?t=<epoch>   (device picks the frame by its own battery voltage)
                                   ▼
        ESP32-S3 RockBase NM-EPD-420-BW: wake on schedule → NTP → fetch → write panel if changed → deep sleep
```

## Phases and tasks

Order is the recommended sequence; **Depends On** is the hard constraint. Cards with no shared dependency can run in any order.

### Phase A — Foundation (repo, reproducible rendering, CI)

| # | Task | Card | Depends on | Model · effort | Tokens |
|---|---|---|---|---|---|
| T01 | Design (done 2026-09-25) | [card](https://app.notion.com/p/3e7d9adbacad80e8b299ef024d9cf444) | — | — | — |
| T02 | Repository bootstrap: GitHub monorepo outside iCloud | [card](https://app.notion.com/p/3e7d9adbacad81f2b514f98ae33439dc) | T01 | GPT-6 Luna · Medium | Low |
| T03 | Pinned renderer container and frame diff tool | [card](https://app.notion.com/p/3e7d9adbacad81d8944bf5365c0dc2c5) | T02 | GPT-6 Sol · Medium | Med |
| T04 | **Jeremy:** approve re-baselined exports (only if T03 found drift) | [card](https://app.notion.com/p/3e7d9adbacad81d2aeded0a2a5cf474e) | T03 | — | — |
| T05 | CI: build in container, zero-diff gate, verify PASS | [card](https://app.notion.com/p/3e7d9adbacad81898570d8ce8ff8056a) | T03 | GPT-6 Luna · Medium | Low |
| T06 | Extract the renderer into an importable library (zero-diff refactor) | [card](https://app.notion.com/p/3e7d9adbacad81cdadc3f7d3b72edb37) | T03 | GPT-6 Sol · High | Med |

### Phase B — Server (data → frame → publish)

| # | Task | Card | Depends on | Model · effort | Tokens |
|---|---|---|---|---|---|
| T07 | NWS condition mapping table and pure mapper module | [card](https://app.notion.com/p/3e7d9adbacad813c90aecad2b0214c39) | T02 | GPT-6 Sol · High | Med |
| T08 | Server scaffold and NWS client with recorded fixtures | [card](https://app.notion.com/p/3e7d9adbacad81778789d00a13ae0218) | T06, T07 | GPT-6 Sol · Medium | Med |
| T09 | Time logic: three-hour marks, daily labels, civil twilight, formatting | [card](https://app.notion.com/p/3e7d9adbacad814fa0e2f5dc1770fcef) | T06 | GPT-6 Sol · Medium | Med |
| T10 | Frame packer: 1-bit PNG to raw framebuffer, decoder, publish bundle | [card](https://app.notion.com/p/3e7d9adbacad8187b4a0c4aebf59bda7) | T06 | GPT-6 Sol · Medium | Low |
| T11 | Render job CLI: fetch → fixture → render both frames → bundle | [card](https://app.notion.com/p/3e7d9adbacad815ba249ccc611a0594e) | T08, T09, T10 | GPT-6 Sol · High | Med |
| T12 | Scheduled publish: GitHub Actions cron to GitHub Pages | [card](https://app.notion.com/p/3e7d9adbacad81bd91adf4876d1bbf55) | T05, T11 | GPT-6 Sol · Medium | Low |
| T13 | **Jeremy:** point `weather.builtbyjer.com` at GitHub Pages (Namecheap) | [card](https://app.notion.com/p/3e7d9adbacad8123ad0dc190ef0cb769) | T12 | — | — |

### Phase C — Firmware (device)

| # | Task | Card | Depends on | Model · effort | Tokens |
|---|---|---|---|---|---|
| T14 [PD] | Firmware spike: board bring-up, display the setup frame, confirm wire format | [card](https://app.notion.com/p/3e7d9adbacad812ca47ddfc930e4a38b) | T10 | GPT-6.1 Sol · High | Med |
| T15 [PD] | Firmware: Wi-Fi provisioning captive portal and setup screen | [card](https://app.notion.com/p/3e7d9adbacad812f82cedeb47e813b0b) | T14 | GPT-6.1 Sol · Medium | Med |
| T16 [PD] | Firmware: wake, sync time, fetch frame, display, deep sleep | [card](https://app.notion.com/p/3e7d9adbacad8159a797d88686a8ee03) | T15, T12 | GPT-6.1 Sol · High | High |
| T17 [PD] | Battery pack, low-battery threshold, and hysteresis (agent + Jeremy) | [card](https://app.notion.com/p/3e7d9adbacad81c5b6a8cab33108c67b) | T14, T16 | GPT-6.1 Sol · Medium | Low |

### Phase D — Verification and closeout

| # | Task | Card | Depends on | Model · effort | Tokens |
|---|---|---|---|---|---|
| T18 [PD] | End-to-end verification and sign-off report | [card](https://app.notion.com/p/3e7d9adbacad816cbd40ea5020c63d90) | T11, T13, T16, T17 | GPT-6.1 Sol · High | Med |
| T19 [PD] | **Jeremy:** battery-life measurement (runs for weeks) | [card](https://app.notion.com/p/3e7d9adbacad81bd8d66fa5c6d5ac2dd) | T17, T18 | — | — |
| T20 | Runbook and documentation closeout | [card](https://app.notion.com/p/3e7d9adbacad81e0be24ec5156dc4c34) | T18, T19 | GPT-6 Luna · High | Low |
| T21 | Optional: external trigger fallback for late GitHub cron runs | [card](https://app.notion.com/p/3e7d9adbacad81549a5bea0cf471bbc7) | T12 | GPT-6 Luna · High | Low |

### Phase E — Project tracking

| # | Task | Card | Depends on | Model · effort | Tokens |
|---|---|---|---|---|---|
| T22 | Live dependency map on the Notion project page | [card](https://app.notion.com/p/3e8d9adbacad8160a56dd55a5a945318) | T02 | GPT-6 Sol · Medium | Low |
| T23 | Orchestrator handoff, independent QA, and review gates | [card](https://app.notion.com/p/3f2d9adbacad8146b8f8f2d5dea31b1e) | T22 | GPT-6.1 Sol · High | Low |

The [Notion project page](https://app.notion.com/p/3e7d9adbacad8068b42ff29eccbf8892) has a **Dependency Gantt** tab. It positions tasks by dependency stage, not calendar date, and derives Complete / In progress / Ready / Blocked plus open blockers from each card's Status and Depends On relations. Status changes update the view automatically. If task dependencies change or a card is added, recompute its **Dependency stage** as one more than the largest stage among its prerequisites (or 1 when it has none). The board is delivered; [PD] tasks still need Jeremy's physical evidence. Dependency stage is scheduling information, not approval to dispatch. Remaining stage values: T14 6, T15 7, T16 8, T17 9, T18 10, T19 11, T20 12, T21 8, T23 4.

**Remaining delivery path:** T14 → T15 → T16 → T17 → T18 → T19 → T20. T21 runs separately, with a reliability disposition before T18 sign-off. T17 now waits for T16's integrated sleep-current evidence; T18 includes calibrated battery behavior; final T20 closeout waits for measured battery life in T19. Draft runbook work can be prepared earlier within an approved task, but cannot claim final closeout.

**Historical whole-project estimate:** about 7–8M tokens before implementation; this is not a remaining-work budget. T23 orchestration preparation is additional. Track actual usage in each run.

## Decisions closed after the planning session

- **2026-09-25, reset-to-setup button:** BOOT (GPIO 0) press wakes and refreshes; held five seconds clears Wi-Fi credentials. USER (GPIO 45) is unused. Recorded in `scope.md` §6 and `decisions.md`.
- **2026-09-25, repository visibility:** public; may be switched later.
- **2026-09-26, pinned renderer re-baseline:** Jeremy approved all seven container-rendered frames and the measured 5 px worst-case hourly gap. Locked stack: Node 22.23.3 on `node:22.23.3-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c`, `sharp` 0.33.5 / libvips 8.15.3, Python 3.11.2, Pillow 12.3.0. The accepted output is the new byte-for-byte reference.

## Decisions that still need Jeremy's word

| Item | Where | Why |
|---|---|---|
| Battery pack purchase | T17 | After sleep current is measured; the board's linear regulator may dominate. |
| Sign-off | T18 | Per `design/review-instructions.md` §8. |

## Facts gathered during planning (2026-09-25)

Recorded here so no task has to rediscover them; each card repeats the subset it needs.

- **Codex models:** Historical selection was GPT-6 Sol/Luna. Use the refreshed model/effort recommendations above for remaining work; current availability was checked on 2026-10-07.
- **NWS for 41.25, -112.03:** office `SLC`, grid `98,198`, time zone `America/Denver`, nearest station `KOGD`. Hourly forecast = 96 one-hour periods; daily = 14 day/night periods with `isDaytime`. `User-Agent` header mandatory. 34 icon codes verified from `https://api.weather.gov/icons`; the `icon` field is deprecated in the schema but retained. Forecast CDN cache is 3600 s; select periods by time, not index.
- **GitHub:** `schedule` accepts `timezone:`; shortest interval 5 min; runs can start late; scheduled workflows pause after 60 days without repository activity. Pages via Actions is exempt from the 10-builds/hour limit; served with `Cache-Control: max-age=600`. Public repo → unlimited Actions minutes. Each repo can have its own Pages site and custom subdomain.
- **Board (RockBase NM-EPD-420-BW):** ESP32-S3R8 + 16 MB flash + 8 MB OPI PSRAM; native USB; vendor builds with `pioarduino`; EPD CS 46 / DC 4 / RST 5 / BUSY 6 (active high) / SCK 2 / MOSI 1; GxEPD2 class `GxEPD2_420_GYE042A87`; framebuffer 1 bpp, MSB first, 1 = white; USER GPIO45 (not RTC-capable), BOOT GPIO0; battery ADC GPIO3 behind a 2:1 divider enabled by GPIO43; charger LGS4056HEP; battery connector JST 1.25 mm 2-pin; sleep current unpublished.

## Changing this plan

Add a card in Notion (next Task Order), link its dependencies, and add a row here in the same pull request. Removing or re-scoping a card: update the card, this file, and `design/decisions.md` if the change touches the rendering contract.
