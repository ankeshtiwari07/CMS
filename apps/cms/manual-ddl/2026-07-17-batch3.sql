-- Batch 3 (governance + schema). Apply once to the CMS database.
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS project_id character varying;      -- one project per discussion
ALTER TYPE enum_aiwebsites_status ADD VALUE IF NOT EXISTS 'in-review';                  -- website In-Review state
