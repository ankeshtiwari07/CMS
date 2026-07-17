# Approval-flow regression (LEAP D3)

Automated, repeatable regression of the two approval flows, asserted at the API
level (not just the UI). Run it at the close of every sprint (and in CI).

## Run

```bash
# against the internal CMS (on the VM)
docker exec haow-cms-console-1 node /path/to/qa/approval-flows.mjs

# or point it anywhere
CMS_URL=http://cms:3001 QA_PW=… node qa/approval-flows.mjs
```

Exit code `0` = all green, `1` = an assertion failed, `2` = harness/setup error.

## What it regresses

**Flow A — Editor content, multi-stage HITL**
- Editor creates content as a draft (medium risk → editorial + final stages).
- Publish before any approval → **403**.
- Reviewer approves editorial; publish with only editorial cleared → still **403** (final pending).
- Publisher approves final; publish now → **200 published**.
- Creator cannot approve their own content (separation of duties) → **403**.

**Flow B — delegated component + the page (dual approval)**
- Editor creating a component as `live` is forced to `draft`.
- Editor publish → 403; Publisher publish before approval → 403.
- Reviewer approves editorial; Publisher publishes → **live**.
- Same gate proven for the AI website (the page): draft → 403 → approve → **published**.

**Immutable audit trail** — every gated artefact has `create` + `publish` entries in the audit log.

## Users
Uses the demo roles `author.en`, `reviewer`, `publisher`, `admin` (shared password
via `QA_PW`). Test artefacts are created with a unique tag and deleted on completion.
