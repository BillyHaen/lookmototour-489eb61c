
-- Add slug column
ALTER TABLE public.events ADD COLUMN slug text;

-- Generate slugs for existing events from title
UPDATE public.events SET slug = 
  lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  )
WHERE slug IS NULL;

-- Make slug unique and not null
ALTER TABLE public.events ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN slug SET DEFAULT '';
CREATE UNIQUE INDEX idx_events_slug ON public.events (slug) WHERE deleted_at IS NULL;
