-- Append-only audit log (referenced by MCP + workflow + AI acceptance logging)
CREATE TABLE IF NOT EXISTS audit_log (
  id        bigserial PRIMARY KEY,
  actor     text NOT NULL,
  action    text NOT NULL,
  entity    text,
  entity_id text,
  diff      jsonb,
  ts        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS audit_ts_idx ON audit_log(ts);
