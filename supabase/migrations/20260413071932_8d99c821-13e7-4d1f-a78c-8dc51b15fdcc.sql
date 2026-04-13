ALTER TABLE public.events ADD COLUMN includes text[] DEFAULT '{}'::text[];
ALTER TABLE public.events ADD COLUMN excludes text[] DEFAULT '{}'::text[];