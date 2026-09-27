# Development plan

**Status:** live. Written 2026-09-25 with Jeremy. This file is the index; the full instructions for each task live on its card in Jeremy's Notion **Dev Tasks** database (project: [ePaper Weather Dash](https://app.notion.com/p/3e7d9adbacad8068b42ff29eccbf8892)). Scope and decisions are in [`scope.md`](scope.md) §9; the frame contract is [`../design/spec.md`](../design/spec.md); the work log is [`../WORKLOG.md`](../WORKLOG.md).

## How a task is run

1. Jeremy opens the next card whose **Depends On** cards are all Done and starts a Codex session with the card's **Model Rec** (model · reasoning effort).
2. The agent reads `README.md`, `AGENTS.md` rules 10–14, `WORKLOG.md`, this file, and the card. It sets the card to *In progress* and opens a work-log entry.
3. One card per session. Work happens on a branch `t<nn>-<slug>` in `~/codeProjects/weather-epaper`; a pull request with green CI is the unit of delivery (from T05 on).
4. Finishing: work-log entry filled in, same summary pasted into the card's **Agent Notes**, Status set to *Done* only when every acceptance criterion passed. Steps only Jeremy can do (flash, photograph, buy, DNS, approve) are listed under *Needs Jeremy* and on the card.
5. Cards whose title starts with **Jeremy:** are not agent-executable.
6. Cards tagged **[PD]** (post-delivery) need the physical board, which was on order on 2026-09-25. Everything without the tag can be done before it arrives: T02 through T13, and T20–T22 once their dependencies allow.

Token bands on the cards: **Low** under 300k tokens, **Med** 300k–1M, **High** over 1M. Estimates are for the whole Codex session including reading context; Jeremy is on ChatGPT Plus, where GPT-6 Astra is rate-limited and burns quota about twice as fast as Sol, so the plan uses **Sol** for judgment work and **Luna** for mechanical work and reserves Astra for nothing by default. Effort ladder in Codex: Light · Medium · High · Extra High · Max (Ultra on Astra/Sol only).

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
| T14 [PD] | Firmware spike: board bring-up, display the setup frame, confirm wire format | [card](https://app.notion.com/p/3e7d9adbacad812ca47ddfc930e4a38b) | T10 | GPT-6 Sol · High | Med |
| T15 [PD] | Firmware: Wi-Fi provisioning captive portal and setup screen | [card](https://app.notion.com/p/3e7d9adbacad812f82cedeb47e813b0b) | T14 | GPT-6 Sol · Medium | Med |
| T16 [PD] | Firmware: wake, sync time, fetch frame, display, deep sleep | [card](https://app.notion.com/p/3e7d9adbacad8159a797d88686a8ee03) | T15, T12 | GPT-6 Sol · High | High |
| T17 [PD] | Battery pack, low-battery threshold, and hysteresis (agent + Jeremy) | [card](https://app.notion.com/p/3e7d9adbacad81c5b6a8cab33108c67b) | T14 | GPT-6 Sol · Medium | Low |

### Phase D — Verification and closeout

| # | Task | Card | Depends on | Model · effort | Tokens |
|---|---|---|---|---|---|
| T18 [PD] | End-to-end verification and sign-off report | [card](https://app.notion.com/p/3e7d9adbacad816cbd40ea5020c63d90) | T11, T13, T16 | GPT-6 Sol · Medium | Med |
| T19 [PD] | **Jeremy:** battery-life measurement (runs for weeks) | [card](https://app.notion.com/p/3e7d9adbacad81bd8d66fa5c6d5ac2dd) | T17, T18 | — | — |
| T20 | Runbook and documentation closeout | [card](https://app.notion.com/p/3e7d9adbacad81e0be24ec5156dc4c34) | T18 | GPT-6 Luna · Medium | Low |
| T21 | Optional: external trigger fallback for late GitHub cron runs | [card](https://app.notion.com/p/3e7d9adbacad81549a5bea0cf471bbc7) | T12 | GPT-6 Luna · Light | Low |

### Phase E — Project tracking

| # | Task | Card | Depends on | Model · effort | Tokens |
|---|---|---|---|---|---|
| T22 | Live dependency map on the Notion project page | [card](https://app.notion.com/p/3e8d9adbacad8160a56dd55a5a945318) | T02 | GPT-6 Sol · Medium | Low |

The [Notion project page](https://app.notion.com/p/3e7d9adbacad8068b42ff29eccbf8892) has a **Dependency Gantt** tab. It positions tasks by dependency stage, not calendar date, and derives Complete / In progress / Ready / Blocked plus open blockers from each card's Status and Depends On relations. Status changes update the view automatically. If task dependencies change or a card is added, recompute its **Dependency stage** as one more than the largest stage among its prerequisites (or 1 when it has none). Hardware tasks tagged [PD] also need the board before work starts.

**Critical path:** T02 → T03 → T06 → T10 → T14 → T15 → T16 → T18. Phase B (T07–T12) can interleave with Phase C once T10 exists; T07 can start right after T02.

**Rough budget:** 17 agent tasks; sum of the band midpoints is about 7–8M tokens, dominated by T16 (device loop), T06 (renderer refactor), and T11 (render CLI).

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

- **Codex models:** GPT-6 Astra (`gpt-6-astra`), GPT-6 Sol (`gpt-6-sol`), GPT-6 Luna (`gpt-6-luna`); GPT-5.5 retires from ChatGPT/Codex 2026-10-14. Plus plan: 5-hour and weekly windows; Astra limited.
- **NWS for 41.25, -112.03:** office `SLC`, grid `98,198`, time zone `America/Denver`, nearest station `KOGD`. Hourly forecast = 96 one-hour periods; daily = 14 day/night periods with `isDaytime`. `User-Agent` header mandatory. 34 icon codes verified from `https://api.weather.gov/icons`; the `icon` field is deprecated in the schema but retained. Forecast CDN cache is 3600 s; select periods by time, not index.
- **GitHub:** `schedule` accepts `timezone:`; shortest interval 5 min; runs can start late; scheduled workflows pause after 60 days without repository activity. Pages via Actions is exempt from the 10-builds/hour limit; served with `Cache-Control: max-age=600`. Public repo → unlimited Actions minutes. Each repo can have its own Pages site and custom subdomain.
- **Board (RockBase NM-EPD-420-BW):** ESP32-S3R8 + 16 MB flash + 8 MB OPI PSRAM; native USB; vendor builds with `pioarduino`; EPD CS 46 / DC 4 / RST 5 / BUSY 6 (active high) / SCK 2 / MOSI 1; GxEPD2 class `GxEPD2_420_GYE042A87`; framebuffer 1 bpp, MSB first, 1 = white; USER GPIO45 (not RTC-capable), BOOT GPIO0; battery ADC GPIO3 behind a 2:1 divider enabled by GPIO43; charger LGS4056HEP; battery connector JST 1.25 mm 2-pin; sleep current unpublished.

## Changing this plan

Add a card in Notion (next Task Order), link its dependencies, and add a row here in the same pull request. Removing or re-scoping a card: update the card, this file, and `design/decisions.md` if the change touches the rendering contract.
