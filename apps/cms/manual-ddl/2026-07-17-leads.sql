CREATE TABLE IF NOT EXISTS leads (
  id serial PRIMARY KEY,
  site_slug character varying,
  name character varying,
  email character varying,
  message character varying,
  updated_at timestamp(3) with time zone NOT NULL DEFAULT now(),
  created_at timestamp(3) with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_site_slug_idx ON leads (site_slug);
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at);
CREATE INDEX IF NOT EXISTS leads_updated_at_idx ON leads (updated_at);
ALTER TABLE payload_locked_documents_rels ADD COLUMN IF NOT EXISTS leads_id integer;
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_leads_id_idx ON payload_locked_documents_rels (leads_id);
DO $$ BEGIN
  ALTER TABLE payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_leads_fk FOREIGN KEY (leads_id) REFERENCES leads(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
