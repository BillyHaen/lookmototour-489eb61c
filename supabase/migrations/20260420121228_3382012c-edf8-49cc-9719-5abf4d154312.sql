-- Add SEO + landing page fields to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS hero_subheadline text,
  ADD COLUMN IF NOT EXISTS cta_primary_label text,
  ADD COLUMN IF NOT EXISTS opening_hook text,
  ADD COLUMN IF NOT EXISTS why_join text,
  ADD COLUMN IF NOT EXISTS experience_section text,
  ADD COLUMN IF NOT EXISTS about_destination text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS trust_section text,
  ADD COLUMN IF NOT EXISTS itinerary jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS internal_link_blog_tag text;

-- Ensure slug is unique (sparse — ignore empty/null)
CREATE UNIQUE INDEX IF NOT EXISTS events_slug_unique_idx
  ON public.events (slug)
  WHERE slug IS NOT NULL AND slug <> '';