
ALTER TABLE public.events
ADD COLUMN requirements text[] DEFAULT '{}'::text[],
ADD COLUMN insurance_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN insurance_description text DEFAULT '';
