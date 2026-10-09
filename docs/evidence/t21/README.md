# T21 scheduler evidence — 2026-10-02 through 2026-10-08

Seven complete calendar days in `America/Denver` (MDT, UTC−06:00).
Expected prepublication is 04:47, then :17/:47 during 05:00–21:59:
35 triggers and 35 corresponding 05:00–22:00 device wakes per day.
The workflow schedule existed throughout this week (last workflow change
22e3863 on 2026-09-27; original publisher 568dbd0 that same day).

The GitHub API supplied 66 total publisher runs, with complete pagination.
`runs.json` retains their identifiers, event types, timestamps, revisions,
conclusions, and relevant job/step evidence. Actor/account payloads and
unrelated API fields are omitted. Job evidence was fetched for all 66 runs
from `/repos/jeremyward37/weather-epaper/actions/runs/{id}/jobs?per_page=100`.
All jobs fit in one page. The earlier history supplies the prior deployment
needed to calculate the first wake's publication age. Runs outside the week
remain in the evidence but do not inflate the weekly run counts.

## Result

- 245 expected slots; 36 observed scheduled runs and 1 manual run.
- All 36 scheduled runs reported success, but 7 skipped rendering/deployment.
  Only 29 scheduled runs actually completed a successful Pages deploy step.
  The manual run supplied one additional publication.
- 25 of 245 wakes (10.20%) had a new scheduled publication in the preceding
  half-hour. Including the manual publication: 26 of 245 (10.61%).
- 25 arrival buckets contained 29 scheduled arrivals (4 buckets had multiple
  arrivals); 220 buckets were empty. Another 7 arrivals fell outside buckets.
- Maximum successive publication gap within the week: 1,107.167 minutes
  (18 hours, 27 minutes, 10 seconds). This includes overnight time.
- Maximum deployment age at a scheduled wake: 1,091.467 minutes
  (18 hours, 11 minutes, 28 seconds).
- p95 creation-to-publication duration among the 30 publications was
  9.9 minutes; the maximum was 21.75 minutes and 1 publication took longer
  than the 13-minute nominal lead. This excludes the missing/no-op publications and is not a
  measure of true cron trigger lateness.

Daily counts and all 245 slots are in `summary.json` and `slots.csv`.

## Interpretation and reproducibility

Run creation is an **observational arrival**, not the original scheduled
trigger time. A bucket is `[expected time, expected time + 30 minutes)`;
a delayed run may land in another trigger's bucket. Empty buckets and the
209-run weekly count deficit expose severe underdelivery, but cannot
identify which exact triggers were dropped rather than delayed/coalesced.
No modulo-based “true lateness” is calculated.

For each device wake, new publication means a successful Pages deployment
completed strictly after the previous wake and at or before this wake.
The first daily wake uses 04:30 as its lower bound. The last successful
publication before each wake is also retained, allowing age to carry across
midnight. Successful deployment-step completion is a server-side proxy;
this evidence does not establish CDN visibility, NWS observation age, or
physical device downloads.

Expected slots are constructed in the local timezone and converted to UTC.
Tests include Mountain winter offsets and the spring/fall DST transitions.
The approved slots are after transition hours, so each day still has 35 slots.

Reproduce directly from the sanitized evidence; no credentials or network:

```sh
python3 tools/cron-drift.py \
  --runs docs/evidence/t21/runs.json \
  --start 2026-10-02 --end 2026-10-08 \
  --out /tmp/weather-t21-reproduced
python3 -m unittest tools.test_cron_drift
```

`summary.json` and `slots.csv` were reproduced byte for byte from the
sanitized input. Original source creation timestamps (rather than guessed
cron slot assignments) remain available for independent checking.

The evidence also includes the morning symptom: run 37918380422 arrived
2026-10-09 04:33:56 MDT and skipped Docker/render/upload/deploy. The previous
night's successful deployment, run 37877592741, completed 2026-10-08
21:05:35 MDT. These are outside the seven-day analysis except that the
previous-night run is included in October 8's counts.
