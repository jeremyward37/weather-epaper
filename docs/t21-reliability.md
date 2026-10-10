# T21 — publishing reliability and Google Cloud Scheduler

Investigated 2026-10-09; production base `a0ca889f`. Jeremy selected Google Cloud Scheduler in this chat on 2026-10-09. This is the proposed delivery and activation packet; the external jobs are not active yet.

## Finding

The GitHub schedule is not delivering the required half-hourly cadence. The configured schedule is `47 4 * * *` plus `17,47 5-21 * * *`, `America/Denver`: 35 publish opportunities/day for device wakes 05:00–22:00. The complete measurement week is 2026-10-02 through 2026-10-08, 245 expected slots. See [summary.json](evidence/t21/summary.json), [runs.json](evidence/t21/runs.json), and the 245-row [slots.csv](evidence/t21/slots.csv). Schedule history is unchanged since 2026-09-27.

| Complete week, MDT | Result |
| --- | --- |
| Expected slots | 245 (35/day) |
| Scheduled workflow arrivals | 36 (4–6/day) |
| Scheduled runs with successful deployment | 29 |
| Scheduled successful no-ops (deploy skipped) | 7 |
| Expected slots with no observed arrival in their half-hour bucket | 220/245 |
| Wakes with a new scheduled deployment in preceding half-hour | 25/245 (10.20%) |
| Wakes with a new deployment including manual runs | 26/245 (10.61%) |
| Largest gap between successful publications, including overnight | 18h 27m 10s |
| Maximum successful-publication age at a device wake | 18h 11m 28s |
| Workflow arrival → successful publication, among 30 actual publications | p95 9.9 min; max 21.75 min; one exceeded the 13-minute lead |

An opportunity's observational bucket is `[expected cron time, next half-hour)`. Its publication-before-wake interval is `(previous wake, current wake]`, allowing a delayed older event that actually publishes before the wake. These are useful freshness measures, not original-event matching. Manual publishes are reported separately. 209 fewer arrivals than expected is a count deficit; the slot table additionally shows empty buckets and multiple arrivals in the same bucket. Publication times are successful Pages deploy-step completion (job-completion fallback), not workflow start or its generic success status; served freshness at historical wakes was not separately probed.

The symptom at about 08:00 on 2026-10-09 is explained by the server history:

- [Run 37877592741](https://github.com/jeremyward37/weather-epaper/actions/runs/37877592741) arrived 2026-10-08 21:04:41 MDT and completed its deploy step at 21:05:35.
- [Run 37918380422](https://github.com/jeremyward37/weather-epaper/actions/runs/37918380422) arrived 2026-10-09 04:33:56 MDT. It reported success, but its render/upload/deploy steps were skipped because it was outside the publish window.
- The next run did not arrive until 11:12:27 MDT. No new morning frame was published before Jeremy's reset.
- A later live HTTPS read returned footer `10/9 3:53 PM`, `renderedAt=2026-10-09T21:53:10.290Z`. A later working URL does not establish morning freshness or device wake reliability.

This establishes inadequate server publication independent of the device. It does not prove that every physical scheduled device fetch succeeded. All observed scheduled runs in the week reported success, which includes skipped deployments. GitHub acknowledges schedule delays and dropped jobs under load in its [workflow troubleshooting documentation](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows). The API does not expose the original intended cron slot for a delayed schedule event: absence in a slot means no observed arrival/delivery in that interval, not proof of a particular event's drop or exact delay. Do not derive true p95 scheduling delay by rounding run timestamps to the nearest cron minute.

## Selected path and alternatives

| Path | Recurring cost at this workload | Fit |
| --- | --- | --- |
| **Google Cloud Scheduler → existing GitHub dispatch → Pages** | Two jobs fit the ongoing three-jobs-per-billing-account free allowance, assuming it is unused; extra jobs are $0.10/job/month. Billing account required. | Selected. Replaces the failing schedule trigger, preserves pixel-exact renderer and device URL, supplies delivery logs and configurable retries, introduces a platform usable for future apps. |
| cron-job.org → GitHub dispatch | Free, no billing account | Valid no-card option; custom HTTP requests/history. Its FAQ makes no punctuality guarantee and states that it does not validate target TLS certificates. |
| Cloud Scheduler → Cloud Run render job → static storage | Compute likely fits ongoing free allowance; registry/storage/operations may add small charges. Requires measured image size/runtime and a full estimate. | Full migration if dispatched Actions still miss deadlines, or Jeremy wants broader hosting. Can retain the pinned Debian renderer rather than rebaseline text. |
| EventBridge Scheduler → Lambda → storage/CDN | Scheduler/Lambda usage likely within free allowances; storage/container registry/logs may cost extra | Capable future platform, but Lambda needs an adapter and container/runtime validation. More migration work than fixing the trigger. |
| Cloudflare Workers | Free/paid tiers exist | Ordinary Workers cannot directly run the current native sharp/libvips Docker renderer. Containers or a renderer port adds cost/work and must prove byte identity. |

Sources checked 2026-10-09: [Scheduler pricing](https://cloud.google.com/scheduler/pricing), [delivery/retries](https://docs.cloud.google.com/scheduler/docs/overview), [cron-job.org FAQ](https://cron-job.org/en/faq/), [Cloud Run pricing](https://cloud.google.com/run/pricing), [Artifact Registry pricing](https://cloud.google.com/artifact-registry/pricing), [EventBridge pricing](https://aws.amazon.com/eventbridge/pricing/), [Lambda pricing](https://aws.amazon.com/lambda/pricing/), [Lambda container adapter](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

Once a run arrived, the measured p95 to publication was 9.9 minutes, but one took 21.75 minutes. The 13-minute lead therefore still needs actual post-change verification. Google documents at-least-once delivery and configurable retries; this is a stronger scheduling contract than the current trigger, not a guarantee that GitHub's runner, NWS or Pages always completes before a wake. A successful dispatch acknowledgement means accepted work, not a fresh deployed frame. We will assess actual deployment and served metadata for seven complete days before T21 can be Done. Existing GitHub cron stays as fallback during the trial. Duplicate dispatches can create redundant renders; the existing Pages concurrency group serializes publication. No DNS change or firmware flash is needed for this selected path.

## Proposed software correction

`server/bin/publish-window.js` must admit `workflow_dispatch` at 04:47–04:59 as well as `schedule`, so Google's early job can prepare the 05:00 wake. Preserve overnight skipping and the schedule-only grace period after 22:00. Tests cover the boundary and Mountain summer/winter/DST. This correction alone does not activate the scheduler and does not change frame layout or files served to the board.

## Needs Jeremy — credentials and activation

The card requires Jeremy to create credentials. No Google Cloud CLI/session is available in this environment. Do not paste tokens into chat, Git, screenshots or logs.

1. Review/authorize merging the T21 PR once both required CI jobs are green. The 04:47 dispatch correction must be on `main` before activation. The current publisher continues meanwhile.
2. Sign in to [Google Cloud Console](https://console.cloud.google.com/), choose/create a project and attach a billing account. Confirm fewer than two of the three free Scheduler job slots are already used across that billing account; otherwise the additional job charge is $0.10/month each. Enable Cloud Scheduler. A budget alert may be added; it is an alert, not a hard spending cap.
3. Create a fine-grained GitHub PAT owned by `jeremyward37`, selected repository **weather-epaper only**, repository permission **Actions: Read and write**, with an explicit expiration you will renew. Store it in a password manager and in the Scheduler Authorization header. Restrict who can view/edit Scheduler jobs because the stored header contains this credential. Google's OIDC service-account token is not a GitHub PAT substitute. GitHub's [dispatch endpoint](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event) documents the required permission.
4. In Cloud Scheduler, create two HTTP jobs in `us-central1`, both timezone **America/Denver**:

| Field | Early job | Daytime job |
| --- | --- | --- |
| Name | `weather-epaper-first-wake` | `weather-epaper-half-hour` |
| Frequency | `47 4 * * *` | `17,47 5-21 * * *` |
| Target | HTTP | HTTP |
| URL | `https://api.github.com/repos/jeremyward37/weather-epaper/actions/workflows/publish.yml/dispatches` | Same |
| Method | POST | POST |
| Body | `{"ref":"main"}` | Same |
| Auth mode | None (use the custom PAT header below) | Same |
| Headers | `Authorization: Bearer <scoped PAT>`; `Accept: application/vnd.github+json`; `Content-Type: application/json`; `X-GitHub-Api-Version: 2022-11-28` | Same |
| Attempt deadline | 30 seconds | Same |
| Retry count | 3 | Same |
| Max retry duration | 0 seconds (use retry-count limit) | Same |
| Min / max backoff | 30 / 120 seconds | Same |
| Max doublings | 2 | Same |

Use the private Console header fields to enter the PAT. Do not put the token in the URL/body or command-line examples. Follow [Google's job creation instructions](https://docs.cloud.google.com/scheduler/docs/creating) for field names, HTTP headers and retry settings. Schedule follows local daylight time; Denver's DST transition occurs before the first 04:47 job, so these chosen slots are not in the repeated/skipped hour.

5. Use **Force run** during the allowed publish window and confirm an accepted 2xx response, a new **workflow_dispatch** Actions run, successful render and deploy, and advanced `meta.json` with a current epoch query (`?t=<current-epoch-seconds>`). Then inspect the two jobs' next-run previews: the early job at 04:47 and the daytime job at 05:17/05:47 etc., ending at 21:47. A 2xx dispatch response alone is insufficient.
6. Record activation time, job names/project (no secret), test-run URL and live `renderedAt` on this card. Capture seven full local days afterward: 245 expected pre-wake opportunities, dispatch arrival/completion, successful deploy completion, and cache-busted live metadata before each wake. Track skipped/failed/duplicate runs and gaps. Save evidence daily: do not rely on a scheduler's short UI history. Recheck 04:47 delivery and 22:00 final wake explicitly. Hardware confirmation remains Jeremy's.

If runner/render/deploy still misses the 13-minute lead time under the external trigger, escalate within T21 to a concrete Cloud Run/storage migration proposal with byte-identity checks and estimated total charges. Rollback: pause the two external jobs and revoke their scoped PAT; existing GitHub cron and deployed frame remain. Reverting the prepublish correction is not needed to pause the service.

## Execution recommendations and gates

Current [OpenAI model documentation](https://learn.chatgpt.com/docs/models) was fetched 2026-10-09, and the host advertises `gpt-6.1-sol` with High effort. Use GPT-6.1 Sol · High for this T21 implementation and independent QA; GPT-6 Luna · High for bounded follow-up evidence summaries. Use GPT-6.1 Sol · High for any full hosting migration and its independent byte-identity QA. These are recommendations, not claims that this chat's primary model was changed.

| Criterion | Evidence/status |
| --- | --- |
| Full-week missing slots, starts and deployment before wakes measured | Measurement/tool/evidence in this PR; independent QA Pass |
| Decision recorded | Jeremy selected Google Cloud Scheduler on 2026-10-09 |
| Readiness fix verified | Four local boundary tests pass, independent QA Pass; required CI pending |
| External trigger implemented/live | Pending Jeremy credentials and activation |
| Week of post-change on-time publications | Pending, cannot be simulated or inferred from local tests |
| Required CI / acceptance / merge | PR CI, Jeremy review and authorized merge pending |

T21 stays **In progress**. T16's hardware/merge criteria remain pending independently; this packet does not claim a device test or start another card.


## Independent preparation QA

Separate `t21_qa` agent reviewed the completed preparation. Seven measurement tests, four prepublish tests and the complete 360-test server suite passed with bundled Node24/Python. QA reproduced all three evidence files byte for byte and independently recalculated every one of the 245 slots. Pricing conditions, scoped-PAT/API configuration, retries and local/DST schedules match official documentation. No blocking preparation defects found. Activation, seven actual post-change days, required CI and Jeremy acceptance/merge remain pending; this is not a production reliability verdict.
