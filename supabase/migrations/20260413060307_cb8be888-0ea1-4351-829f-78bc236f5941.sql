
-- Add towing config to events
ALTER TABLE public.events
ADD COLUMN towing_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN towing_pergi_price integer NOT NULL DEFAULT 0,
ADD COLUMN towing_pulang_price integer NOT NULL DEFAULT 0;

-- Add towing selections to registrations
ALTER TABLE public.event_registrations
ADD COLUMN towing_pergi boolean NOT NULL DEFAULT false,
ADD COLUMN towing_pulang boolean NOT NULL DEFAULT false;
