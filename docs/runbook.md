# Weather frame publishing runbook

## Schedule and output

Google Cloud Scheduler job `weather-epaper-half-hour` should use
`17,47 * * * *` with timezone `America/Denver`: :17 and :47 every hour,
24 hours a day. GitHub Actions uses the same cron as fallback.
The server accepts publication at any hour. The display wakes for :00/:30,
also 24 hours a day; the nominal publishing lead is 13 minutes.
Normally there are 48 opportunities per day, 46/50 on spring/fall DST days.
A dispatch acknowledgement does not establish that rendering/deployment finished;
verify fresh live metadata before the target wake. The previous :25/:55
Google schedule gave only five minutes of lead.

To update the external job: in Google Cloud Console, project `weather-epaper`,
Cloud Scheduler → `weather-epaper-half-hour` (us-central1) → Edit, set Frequency
to `17,47 * * * *` and timezone to `America/Denver`. Preserve the existing HTTP
POST target, body, authorization header and retries. Save and verify the next
run preview. Do not recreate or expose the private token. This setting is external
to Git; record completion separately from the software deployment.

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
The external jobs are **not yet active**. Follow the exact credential, two-job
setup, rollback and seven-day acceptance procedure in
[docs/t21-reliability.md](t21-reliability.md). Keep the scoped PAT in the private
Scheduler job headers, never in this repository. A successful HTTP dispatch is
not evidence of a completed publication: verify the deploy job and live metadata.
