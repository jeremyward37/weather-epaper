# Orchestration state

This is the durable handoff ledger; update it with each run and approval. WORKLOG remains the append-only session history; Notion cards hold acceptance/status. Never store secrets.

- **Updated:** 2026-10-07
- **Active card:** T23 orchestration preparation
- **Stage:** Handoff prepared; awaiting GitHub publication and CI
- **Branch:** `codex/t23-orchestration`
- **PR / revision:** PR pending (GitHub rejects branch push with Internal Server Error); preparation commit `10cdf4d`, followed by handoff-status documentation commit
- **Independent QA:** Pass; three requested clarifications resolved. TOML parsing, relative links, task-row consistency, whitespace and Notion readback passed.
- **Pending Jeremy action:** Local instructions are reviewable now; approve merge and starting T14 only after the PR exists and required CI is green. No hardware action is required to resolve the GitHub error.
- **Next eligible task:** T14 after the T23 approval/merge gate. T21 is separately eligible, not automatically dispatched.
- **Hardware:** Delivered 2026-10-06; unopened; no flash/photo/current measurements or physical acceptance yet.

## Approval ledger

No implementation/release approvals recorded by this handoff. Jeremy's 2026-10-07 request authorizes preparing the orchestration setup, card updates, and this PR. It does not approve future frames, firmware, hardware checks, merges, deployment, purchases, or completion.

For each future approval append: task, date/time in America/Denver, human message/card evidence, PR/revision/artifact hash, approved action (review acceptance / merge / deploy / advance), and remaining restrictions. Preserve previous entries.

## Review packet template

```markdown
Task / PR / revision:
Stage and Notion status:
Implemented behavior:
Acceptance table (criterion | evidence | Pass/Fail/Pending):
Independent QA agent and verdict:
Commands run / CI link:
Artifact path and SHA-256:
Needs Jeremy (exact steps / expected results / evidence to return):
Open issues / rollback:
Approval requested (accept / merge / deploy / start next task):
```

## Resume T23 publication

The handoff remains In progress. GitHub repeatedly rejected branch pushes with Internal Server Error using both the environment token and the existing keyring credential; reads work. No remote branch or PR was observed. `./tools/render.sh` could not run because the Docker daemon is stopped; required CI has not run. These are pending checks, not passes. Named-role client discovery/loading remains unverified; scoped collaboration prompts are available.

Resume this card first: locate branch `codex/t23-orchestration` and the worktree `/private/tmp/weather-epaper-orchestration` (if the temporary checkout is gone, recreate a worktree from that saved branch). Check the remote branch and existing PR before retrying. Push the branch, open/attach the PR, wait for required CI, resolve failures, then update this state and the T23 Agent Notes. Do not implement T14 or merge while publication/CI or Jeremy's gate is pending.
