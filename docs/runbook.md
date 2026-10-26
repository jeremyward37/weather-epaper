# Weather frame publishing runbook

## Schedule and output

Google Cloud Scheduler dispatches `.github/workflows/publish.yml` on `main`;
GitHub Actions fetches NWS data, renders, and publishes to GitHub Pages. GitHub
cron remains fallback at 04:47, then :17/:47 from 05–21, `America/Denver`.
Jeremy’s 2026-10-26 screenshot confirms one listed Enabled job in `us-central1`:
`weather-epaper-half-hour`, `25,55 4-22 * * *`, `America/Denver`.
It dispatches 38 times daily from 04:25 through 22:55. Assuming on-time workflow starts, the current guard skips
04:25, 22:25 and 22:55, leaving 35 eligible publications at 04:55 and
05:25/05:55 through 21:55. This leaves five minutes before device wakes
05:00–22:00; delivery reliability remains unverified. External/manual dispatches
are allowed at 04:47–04:59 and 05:00–22:00; overnight dispatches skip publication.
The fallback's scheduled events retain the existing final-run grace after 22:00.
Evidence is user-provided; no direct Cloud console read was performed.

The `render` job uses the pinned renderer container and uploads `public/` only
after `server/bin/render.js` exits successfully. The `deploy` job depends on
that upload and alone enters the protected `github-pages` environment. A failed
NWS fetch or render leaves the prior Pages deployment live. The published bundle contains
`frame.bin`, `frame-lowbat.bin`, their PNG review copies, `meta.json`, and
`index.html`. Each binary must be 15,000 bytes.

## Run again and inspect logs

From the repository's Actions tab, choose **Publish weather frame** and
**Run workflow** on `main`. For a failed run, open that run and inspect
**Check local publish window**, **Build pinned renderer from Actions cache**,
and **Render complete publish bundle** in the `render` job. The renderer prints one JSON line with
the failing `step` and error; its exit code is 2. **Upload Pages artifact**
and the `deploy` job should be skipped after a render failure.

With GitHub CLI access, the equivalents are:

```sh
gh workflow run publish.yml --ref main
gh run list --workflow publish.yml --limit 5
gh run view RUN_ID --log
gh run rerun RUN_ID --failed
```

Check the deployed result at
`https://jeremyward37.github.io/weather-epaper/`: `index.html` previews both
frames and `meta.json` records `renderedAt`, `dataUpdateTime`, and hashes.
Check `frame.bin` and `frame-lowbat.bin` sizes and confirm `renderedAt`
advances between successful scheduled runs. Pages may cache a file for up to
10 minutes; append `?t=<current-epoch-seconds>` when checking fresh content.

## Schedule inactivity and delays

GitHub disables scheduled workflows in a public repository after 60 days with
no repository activity. In **Actions → Publish weather frame**, choose
**Enable workflow** if it is disabled. With CLI access, run
`gh workflow enable publish.yml`. A manual dispatch verifies that it works
again; do it during the local publish window.

Scheduled runs can arrive late or be dropped. Compare run creation times with
the expected local slots and check `meta.json`. The 2026-10-02–2026-10-08 T21 measurement confirmed only 29 scheduled
deployments against 245 expected opportunities. Jeremy selected Google Cloud
Scheduler to trigger `workflow_dispatch`, retaining GitHub cron as fallback.
The original two jobs activated October 9; Jeremy’s October 26 screenshot now
confirms a consolidated Enabled job at :25/:55 during 04–22. The screenshot’s
09:17:07 Success predates the 09:23:28 update and does not prove execution under
the new schedule. Fresh-publication and seven-day reliability acceptance remain
unverified; T21 stays In progress. See the report for screenshot attribution.
Follow the recorded configuration, rollback and remaining acceptance procedure in
[docs/t21-reliability.md](t21-reliability.md). Keep the scoped PAT in the private
Scheduler job headers, never in this repository. A successful HTTP dispatch is
not evidence of a completed publication: verify the deploy job and live metadata.
