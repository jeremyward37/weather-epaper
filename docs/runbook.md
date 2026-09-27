# Weather frame publishing runbook

## Schedule and output

`.github/workflows/publish.yml` runs at 4:47 AM and at :17/:47 from 5 AM
through 9 PM in `America/Denver`. These 35 runs prepare the 5:00 AM through
10:00 PM device wakes. GitHub may start a scheduled run late. The job checks
the local publish window before rendering; a scheduled run may finish shortly
after 10 PM to serve the last wake. A manual dispatch outside 5 AM–10 PM
skips publication.

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
the expected local slots and check `meta.json`. If repeated delays make the
device miss frames, T21 can add an external trigger using cron-job.org to call
GitHub's `workflow_dispatch` API. Keep its token in the external service, not
in this repository, and check the added trigger's reliability before relying
on it.
