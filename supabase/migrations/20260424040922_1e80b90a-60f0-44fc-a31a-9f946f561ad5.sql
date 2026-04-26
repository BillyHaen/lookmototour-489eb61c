
CREATE OR REPLACE FUNCTION public.create_registration_with_rentals(
  _event_id uuid,
  _payload jsonb,
  _rentals jsonb DEFAULT '[]'::jsonb,
  _credit_redeem integer DEFAULT 0
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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

  SELECT date::date AS start_d, COALESCE(end_date, date)::date AS end_d, title
  INTO _ev FROM public.events WHERE id = _event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  _start_date := _ev.start_d;
  _end_date := _ev.end_d;

  INSERT INTO public.event_registrations (
    event_id, user_id, name, email, phone, motor_type, plate_number,
    emergency_contact, registration_type, towing_pergi, towing_pulang, notes, credit_redeemed
  ) VALUES (
    _event_id, _uid,
    _payload->>'name', _payload->>'email', _payload->>'phone',
    COALESCE(_payload->>'motor_type', ''),
    COALESCE(_payload->>'plate_number', ''),
    COALESCE(_payload->>'emergency_contact', ''),
    COALESCE(_payload->>'registration_type', 'single'),
    COALESCE((_payload->>'towing_pergi')::boolean, false),
    COALESCE((_payload->>'towing_pulang')::boolean, false),
    COALESCE(_payload->>'notes', ''),
    GREATEST(0, COALESCE(_credit_redeem, 0))
  ) RETURNING id INTO _reg_id;

  IF jsonb_array_length(_rentals) > 0 THEN
    FOR _rental IN SELECT * FROM jsonb_array_elements(_rentals) LOOP
      INSERT INTO public.gear_rentals (
        product_id, user_id, event_id, registration_id,
        qty, daily_price, total_days, total_price, deposit_amount,
        start_date, end_date, status
      ) VALUES (
        (_rental->>'product_id')::uuid, _uid, _event_id, _reg_id,
        COALESCE((_rental->>'qty')::int, 1),
        COALESCE((_rental->>'daily_price')::int, 0),
        COALESCE((_rental->>'total_days')::int, 1),
        COALESCE((_rental->>'subtotal')::int, 0),
        COALESCE((_rental->>'deposit')::int, 0),
        _start_date, _end_date, 'pending'
      );
    END LOOP;
  END IF;

  IF COALESCE(_credit_redeem, 0) > 0 THEN
    PERFORM public.redeem_credit(_uid, _credit_redeem, 'redemption',
      'Potongan trip: ' || COALESCE(_ev.title, ''),
      'event_registrations', _reg_id);
  END IF;

  RETURN _reg_id;
END;
$$;

-- Helper for rental checkout to redeem credit atomically
CREATE OR REPLACE FUNCTION public.create_rental_with_credit(
  _product_id uuid,
  _qty integer,
  _daily_price integer,
  _total_days integer,
  _total_price integer,
  _deposit integer,
  _start_date date,
  _end_date date,
  _credit_redeem integer DEFAULT 0
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _rental_id uuid;
  _pname text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT name INTO _pname FROM public.products WHERE id = _product_id;

  INSERT INTO public.gear_rentals (
    product_id, user_id, qty, daily_price, total_days, total_price, deposit_amount,
    start_date, end_date, status, credit_redeemed
  ) VALUES (
    _product_id, _uid, _qty, _daily_price, _total_days, _total_price, _deposit,
    _start_date, _end_date, 'pending', GREATEST(0, COALESCE(_credit_redeem, 0))
  ) RETURNING id INTO _rental_id;

  IF COALESCE(_credit_redeem, 0) > 0 THEN
    PERFORM public.redeem_credit(_uid, _credit_redeem, 'redemption',
      'Potongan rental: ' || COALESCE(_pname, ''),
      'gear_rentals', _rental_id);
  END IF;

  RETURN _rental_id;
END;
$$;

-- Admin manual adjustment
CREATE OR REPLACE FUNCTION public.admin_adjust_credit(
  _user_id uuid,
  _amount integer,
  _reason text DEFAULT 'Penyesuaian admin',
  _expiry_days integer DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF _amount = 0 THEN RETURN NULL; END IF;

  IF _amount > 0 THEN
    _id := public.award_credit(_user_id, _amount, 'manual', _reason, NULL, NULL, _expiry_days);
    -- mark as adjust
    UPDATE public.credit_ledger SET entry_type = 'adjust', source_type = 'manual' WHERE id = _id;
  ELSE
    PERFORM public.redeem_credit(_user_id, ABS(_amount), 'manual', _reason, NULL, NULL);
    INSERT INTO public.credit_ledger (user_id, entry_type, source_type, amount, remaining, description, created_by)
    VALUES (_user_id, 'adjust', 'manual', _amount, 0, _reason, auth.uid())
    RETURNING id INTO _id;
  END IF;

  RETURN _id;
END;
$$;
