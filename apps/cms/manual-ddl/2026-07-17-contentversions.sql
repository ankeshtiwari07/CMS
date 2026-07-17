-- LEAP D4 — content version snapshots. This deployment does NOT auto-create
-- tables from the Payload schema, so a NEW collection needs this DDL applied
-- once against the CMS database (db "humain"). Run on any fresh environment.

-- 1) The snapshot table (matches Payload postgres conventions).
CREATE TABLE IF NOT EXISTS contentversions (
  id serial PRIMARY KEY,
  artifact_key character varying NOT NULL,
  kind character varying,
  title character varying,
  label character varying,
  html character varying,
  doc jsonb,
  created_by_email character varying,
  updated_at timestamp(3) with time zone NOT NULL DEFAULT now(),
  created_at timestamp(3) with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contentversions_artifact_key_idx ON contentversions (artifact_key);
CREATE INDEX IF NOT EXISTS contentversions_created_at_idx ON contentversions (created_at);
CREATE INDEX IF NOT EXISTS contentversions_updated_at_idx ON contentversions (updated_at);

-- 2) REQUIRED: register the collection with Payload document-locking, otherwise
-- the lock query references a non-existent column and EVERY update 500s.
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS contentversions_id integer;
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_contentversions_id_idx ON payload_locked_documents_rels (contentversions_id);
DO $$ BEGIN
  ALTER TABLE payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_contentversions_fk
    FOREIGN KEY (contentversions_id) REFERENCES contentversions(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
