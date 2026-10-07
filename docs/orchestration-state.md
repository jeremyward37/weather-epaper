# Orchestration state

This is the durable handoff ledger; update it with each run and approval. WORKLOG remains the append-only session history; Notion cards hold acceptance/status. Never store secrets.

- **Updated:** 2026-10-07
- **Active card:** T23 orchestration preparation
- **Stage:** Preparing review packet
- **Branch:** `codex/t23-orchestration`
- **PR / revision:** pending
- **Independent QA:** pending
- **Pending Jeremy action:** Review the orchestration PR; approve merge and starting T14 when ready.
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
