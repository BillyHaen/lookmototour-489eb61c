ALTER TABLE public.events
  ADD COLUMN rider_level text NOT NULL DEFAULT 'all',
  ADD COLUMN motor_types text[] NOT NULL DEFAULT '{}',
  ADD COLUMN touring_style text NOT NULL DEFAULT 'adventure',
  ADD COLUMN riding_hours_per_day numeric(3,1) NOT NULL DEFAULT 0,
  ADD COLUMN fatigue_level integer NOT NULL DEFAULT 1;