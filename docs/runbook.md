# Weather frame publishing runbook

## Schedule and output

`.github/workflows/publish.yml` runs at 4:47 AM and at :17/:47 from 5 AM
through 9 PM in `America/Denver`. These 35 runs prepare the 5:00 AM through
10:00 PM device wakes. GitHub may start a scheduled run late. The job checks
the local publish window before rendering; a scheduled run may finish shortly
after 10 PM to serve the last wake. External/manual dispatches are allowed at 4:47–4:59 AM to prepare the first
wake, as well as 5 AM–10 PM. Overnight dispatches still skip publication.

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
