-- Components collection — hand-applied because prod Payload runs with push OFF
-- (drizzle-kit is pruned from the prod image). DDL captured verbatim from a
-- local `payload push` (drizzle-kit 0.31.7) against a scratch DB, so it matches
-- exactly what Payload expects. All statements are additive.
BEGIN;

CREATE TYPE public.enum_components_type AS ENUM ('container','section','hero','text','image','gallery','card','feature','cta','testimonial','stats','logoCloud','pricing','faq','nav','footer','form','banner');
CREATE TYPE public.enum_components_category AS ENUM ('layout','content','media','navigation','marketing','form');
CREATE TYPE public.enum_components_status AS ENUM ('draft','live');

CREATE TABLE public.components (
    id integer NOT NULL,
    name character varying NOT NULL,
    key character varying,
    type public.enum_components_type DEFAULT 'section'::public.enum_components_type NOT NULL,
    category public.enum_components_category DEFAULT 'content'::public.enum_components_category,
    status public.enum_components_status DEFAULT 'draft'::public.enum_components_status NOT NULL,
    description character varying,
    html character varying,
    props jsonb,
    preview_image_id integer,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);
CREATE SEQUENCE public.components_id_seq AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.components_id_seq OWNED BY public.components.id;
ALTER TABLE ONLY public.components ALTER COLUMN id SET DEFAULT nextval('public.components_id_seq'::regclass);
ALTER TABLE ONLY public.components ADD CONSTRAINT components_pkey PRIMARY KEY (id);

CREATE TABLE public.components_tags (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    value character varying
);
ALTER TABLE ONLY public.components_tags ADD CONSTRAINT components_tags_pkey PRIMARY KEY (id);

CREATE INDEX components_created_at_idx ON public.components USING btree (created_at);
CREATE UNIQUE INDEX components_key_idx ON public.components USING btree (key);
CREATE INDEX components_preview_image_idx ON public.components USING btree (preview_image_id);
CREATE INDEX components_updated_at_idx ON public.components USING btree (updated_at);
CREATE INDEX components_tags_order_idx ON public.components_tags USING btree (_order);
CREATE INDEX components_tags_parent_id_idx ON public.components_tags USING btree (_parent_id);

ALTER TABLE ONLY public.components ADD CONSTRAINT components_preview_image_id_media_id_fk FOREIGN KEY (preview_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.components_tags ADD CONSTRAINT components_tags_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.components(id) ON DELETE CASCADE;

ALTER TABLE public.payload_locked_documents_rels ADD COLUMN IF NOT EXISTS components_id integer;
CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_components_id_idx ON public.payload_locked_documents_rels USING btree (components_id);
ALTER TABLE public.payload_locked_documents_rels ADD CONSTRAINT payload_locked_documents_rels_components_fk FOREIGN KEY (components_id) REFERENCES public.components(id) ON DELETE CASCADE;

COMMIT;
