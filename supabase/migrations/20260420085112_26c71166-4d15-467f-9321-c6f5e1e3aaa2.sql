-- 1. Atomic RPC: create registration + rentals in single transaction
CREATE OR REPLACE FUNCTION public.create_registration_with_rentals(
  _event_id uuid,
  _payload jsonb,
  _rentals jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _reg_id uuid;
  _rental jsonb;
  _start_date date;
  _end_date date;
  _ev RECORD;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT date::date AS start_d, COALESCE(end_date, date)::date AS end_d
  INTO _ev
  FROM public.events WHERE id = _event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  _start_date := _ev.start_d;
  _end_date := _ev.end_d;

  -- Insert registration
  INSERT INTO public.event_registrations (
    event_id, user_id, name, email, phone, motor_type, plate_number,
    emergency_contact, registration_type, towing_pergi, towing_pulang, notes
  ) VALUES (
    _event_id,
    _uid,
    _payload->>'name',
    _payload->>'email',
    _payload->>'phone',
    COALESCE(_payload->>'motor_type', ''),
    COALESCE(_payload->>'plate_number', ''),
    COALESCE(_payload->>'emergency_contact', ''),
    COALESCE(_payload->>'registration_type', 'single'),
    COALESCE((_payload->>'towing_pergi')::boolean, false),
    COALESCE((_payload->>'towing_pulang')::boolean, false),
    COALESCE(_payload->>'notes', '')
  )
  RETURNING id INTO _reg_id;

  -- Insert rentals if any
  IF jsonb_array_length(_rentals) > 0 THEN
    FOR _rental IN SELECT * FROM jsonb_array_elements(_rentals)
    LOOP
      INSERT INTO public.gear_rentals (
        product_id, user_id, event_id, registration_id,
        qty, daily_price, total_days, total_price, deposit_amount,
        start_date, end_date, status
      ) VALUES (
        (_rental->>'product_id')::uuid,
        _uid,
        _event_id,
        _reg_id,
        COALESCE((_rental->>'qty')::int, 1),
        COALESCE((_rental->>'daily_price')::int, 0),
        COALESCE((_rental->>'total_days')::int, 1),
        COALESCE((_rental->>'subtotal')::int, 0),
        COALESCE((_rental->>'deposit')::int, 0),
        _start_date,
        _end_date,
        'pending'
      );
    END LOOP;
  END IF;

  RETURN _reg_id;
END;
$$;

-- 2. Cascade cancel: when a registration is cancelled, cancel its rentals
CREATE OR REPLACE FUNCTION public.cascade_cancel_rentals_on_registration_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status = 'cancelled' AND COALESCE(OLD.status,'') <> 'cancelled')
     OR (NEW.payment_status = 'batal' AND COALESCE(OLD.payment_status,'') <> 'batal') THEN
    UPDATE public.gear_rentals
    SET status = 'cancelled', updated_at = now()
    WHERE registration_id = NEW.id
      AND status IN ('pending','confirmed');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_cancel_rentals ON public.event_registrations;
CREATE TRIGGER trg_cascade_cancel_rentals
AFTER UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.cascade_cancel_rentals_on_registration_cancel();

-- 3. Cascade on hard delete of registration
CREATE OR REPLACE FUNCTION public.cascade_cancel_rentals_on_registration_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.gear_rentals
  SET status = 'cancelled', updated_at = now()
  WHERE registration_id = OLD.id
    AND status IN ('pending','confirmed');
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cascade_cancel_rentals_on_delete ON public.event_registrations;
CREATE TRIGGER trg_cascade_cancel_rentals_on_delete
BEFORE DELETE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.cascade_cancel_rentals_on_registration_delete();

-- 4. Cleanup orphan rentals (no registration_id AND no event_id from registration flow)
UPDATE public.gear_rentals
SET status = 'cancelled', updated_at = now()
WHERE registration_id IS NULL
  AND event_id IS NOT NULL
  AND status = 'pending';