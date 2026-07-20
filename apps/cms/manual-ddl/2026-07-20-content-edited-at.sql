DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns
           WHERE table_schema='public' AND column_name='_status' AND table_name NOT LIKE '\_%\_v' ESCAPE '\' LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS content_edited_at timestamp(3) with time zone', t);
  END LOOP;
  FOR t IN SELECT table_name FROM information_schema.columns
           WHERE table_schema='public' AND column_name='version__status' LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS version_content_edited_at timestamp(3) with time zone', t);
  END LOOP;
  BEGIN EXECUTE 'ALTER TABLE aiwebsites ADD COLUMN IF NOT EXISTS content_edited_at timestamp(3) with time zone'; EXCEPTION WHEN undefined_table THEN NULL; END;
END $$;
SELECT 'main tables patched:' AS info, count(*) FROM information_schema.columns WHERE table_schema='public' AND column_name='content_edited_at';
SELECT 'version tables patched:' AS info, count(*) FROM information_schema.columns WHERE table_schema='public' AND column_name='version_content_edited_at';
