
ALTER TABLE public.event_registrations
ADD COLUMN payment_status text NOT NULL DEFAULT 'pending',
ADD COLUMN installment_amount integer NOT NULL DEFAULT 0;
