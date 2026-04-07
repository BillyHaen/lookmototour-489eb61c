
ALTER TABLE public.events
ADD COLUMN price_sharing integer NOT NULL DEFAULT 0,
ADD COLUMN price_single integer NOT NULL DEFAULT 0,
ADD COLUMN price_couple integer NOT NULL DEFAULT 0;

-- Copy existing price to price_single as default
UPDATE public.events SET price_single = price;

ALTER TABLE public.event_registrations
ADD COLUMN registration_type text NOT NULL DEFAULT 'single';
