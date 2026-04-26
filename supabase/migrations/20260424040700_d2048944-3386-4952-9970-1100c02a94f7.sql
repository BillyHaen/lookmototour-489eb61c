
-- 1. Wallet settings (singleton, id=1)
CREATE TABLE public.wallet_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_expiry_days integer NOT NULL DEFAULT 365,
  max_redeem_percent integer NOT NULL DEFAULT 100 CHECK (max_redeem_percent BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.wallet_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.wallet_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view wallet settings" ON public.wallet_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage wallet settings" ON public.wallet_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Credit ledger
CREATE TYPE public.credit_entry_type AS ENUM ('earn', 'redeem', 'expire', 'adjust', 'refund');
CREATE TYPE public.credit_source_type AS ENUM ('trip', 'product_rental', 'product_purchase', 'manual', 'redemption', 'expiry');

CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_type public.credit_entry_type NOT NULL,
  source_type public.credit_source_type NOT NULL,
  amount integer NOT NULL, -- positive for earn/refund/adjust+, negative for redeem/expire/adjust-
  remaining integer NOT NULL DEFAULT 0, -- only relevant for 'earn' rows; tracks unspent balance
  expires_at timestamptz,
  description text NOT NULL DEFAULT '',
  reference_table text,
  reference_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_ledger_user ON public.credit_ledger(user_id, created_at DESC);
CREATE INDEX idx_credit_ledger_active_earn ON public.credit_ledger(user_id, expires_at)
  WHERE entry_type = 'earn' AND remaining > 0;

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ledger" ON public.credit_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert ledger" ON public.credit_ledger FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update ledger" ON public.credit_ledger FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Credit config per item
CREATE TYPE public.credit_reward_mode AS ENUM ('none', 'fixed', 'percent');

ALTER TABLE public.events
  ADD COLUMN credit_reward_mode public.credit_reward_mode NOT NULL DEFAULT 'none',
  ADD COLUMN credit_reward_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN credit_expiry_days integer;

ALTER TABLE public.products
  ADD COLUMN credit_reward_mode public.credit_reward_mode NOT NULL DEFAULT 'none',
  ADD COLUMN credit_reward_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN credit_expiry_days integer;

-- 4. Track redemption + earned amount on transactions
ALTER TABLE public.event_registrations
  ADD COLUMN credit_redeemed integer NOT NULL DEFAULT 0,
  ADD COLUMN credit_awarded integer NOT NULL DEFAULT 0;

ALTER TABLE public.gear_rentals
  ADD COLUMN credit_redeemed integer NOT NULL DEFAULT 0,
  ADD COLUMN credit_awarded integer NOT NULL DEFAULT 0;

-- 5. Balance function
CREATE OR REPLACE FUNCTION public.get_wallet_balance(_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(SUM(remaining), 0)::integer
  FROM public.credit_ledger
  WHERE user_id = _user_id
    AND entry_type = 'earn'
    AND remaining > 0
    AND (expires_at IS NULL OR expires_at > now());
$$;

-- 6. Award credit
CREATE OR REPLACE FUNCTION public.award_credit(
  _user_id uuid,
  _amount integer,
  _source public.credit_source_type,
  _description text DEFAULT '',
  _reference_table text DEFAULT NULL,
  _reference_id uuid DEFAULT NULL,
  _expiry_days integer DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _new_id uuid;
  _days integer;
  _expires timestamptz;
BEGIN
  IF _amount <= 0 THEN RETURN NULL; END IF;

  SELECT COALESCE(_expiry_days, default_expiry_days, 365) INTO _days FROM public.wallet_settings WHERE id = 1;
  _expires := now() + make_interval(days => _days);

  INSERT INTO public.credit_ledger (user_id, entry_type, source_type, amount, remaining, expires_at, description, reference_table, reference_id)
  VALUES (_user_id, 'earn', _source, _amount, _amount, _expires, _description, _reference_table, _reference_id)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

-- 7. Redeem credit (FIFO by expires_at)
CREATE OR REPLACE FUNCTION public.redeem_credit(
  _user_id uuid,
  _amount integer,
  _source public.credit_source_type,
  _description text DEFAULT '',
  _reference_table text DEFAULT NULL,
  _reference_id uuid DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _balance integer;
  _remaining_to_take integer := _amount;
  _row record;
  _take integer;
BEGIN
  IF _amount <= 0 THEN RETURN 0; END IF;
  SELECT public.get_wallet_balance(_user_id) INTO _balance;
  IF _balance < _amount THEN
    RAISE EXCEPTION 'Insufficient credit balance. Have %, need %', _balance, _amount;
  END IF;

  FOR _row IN
    SELECT id, remaining
    FROM public.credit_ledger
    WHERE user_id = _user_id AND entry_type = 'earn' AND remaining > 0
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY expires_at NULLS LAST, created_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN _remaining_to_take <= 0;
    _take := LEAST(_row.remaining, _remaining_to_take);
    UPDATE public.credit_ledger SET remaining = remaining - _take WHERE id = _row.id;
    _remaining_to_take := _remaining_to_take - _take;
  END LOOP;

  INSERT INTO public.credit_ledger (user_id, entry_type, source_type, amount, remaining, description, reference_table, reference_id)
  VALUES (_user_id, 'redeem', _source, -_amount, 0, _description, _reference_table, _reference_id);

  RETURN _amount;
END;
$$;

-- 8. Expire stale credits
CREATE OR REPLACE FUNCTION public.expire_credits()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _row record;
  _count integer := 0;
BEGIN
  FOR _row IN
    SELECT id, user_id, remaining FROM public.credit_ledger
    WHERE entry_type = 'earn' AND remaining > 0 AND expires_at IS NOT NULL AND expires_at <= now()
    FOR UPDATE
  LOOP
    INSERT INTO public.credit_ledger (user_id, entry_type, source_type, amount, remaining, description, reference_table, reference_id)
    VALUES (_row.user_id, 'expire', 'expiry', -_row.remaining, 0, 'Kredit kedaluwarsa', 'credit_ledger', _row.id);
    UPDATE public.credit_ledger SET remaining = 0 WHERE id = _row.id;
    _count := _count + 1;
  END LOOP;
  RETURN _count;
END;
$$;

-- 9. Helper: compute earn amount
CREATE OR REPLACE FUNCTION public.compute_credit_reward(_mode public.credit_reward_mode, _value numeric, _base_amount numeric)
RETURNS integer
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN _mode = 'fixed' THEN GREATEST(0, _value)::integer
    WHEN _mode = 'percent' THEN GREATEST(0, ROUND(_base_amount * _value / 100.0))::integer
    ELSE 0
  END;
$$;

-- 10. Trigger: award on event_registrations payment paid
CREATE OR REPLACE FUNCTION public.trg_award_credit_on_registration_paid()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ev record;
  _base numeric;
  _amt integer;
BEGIN
  IF NEW.payment_status = 'paid' AND COALESCE(OLD.payment_status, '') <> 'paid' AND NEW.credit_awarded = 0 THEN
    SELECT credit_reward_mode, credit_reward_value, credit_expiry_days, price, price_single, price_sharing, price_couple, title
      INTO _ev FROM public.events WHERE id = NEW.event_id;
    IF _ev.credit_reward_mode = 'none' OR _ev.credit_reward_value <= 0 THEN RETURN NEW; END IF;

    _base := CASE NEW.registration_type
      WHEN 'sharing' THEN COALESCE(NULLIF(_ev.price_sharing,0), _ev.price)
      WHEN 'couple' THEN COALESCE(NULLIF(_ev.price_couple,0), _ev.price)
      ELSE COALESCE(NULLIF(_ev.price_single,0), _ev.price)
    END;
    _amt := public.compute_credit_reward(_ev.credit_reward_mode, _ev.credit_reward_value, _base);
    IF _amt > 0 THEN
      PERFORM public.award_credit(NEW.user_id, _amt, 'trip',
        'Kredit dari trip: ' || COALESCE(_ev.title,''),
        'event_registrations', NEW.id, _ev.credit_expiry_days);
      NEW.credit_awarded := _amt;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_credit_on_registration_paid
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.trg_award_credit_on_registration_paid();

-- 11. Trigger: award on gear_rentals returned/completed
CREATE OR REPLACE FUNCTION public.trg_award_credit_on_rental_returned()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _p record;
  _base numeric;
  _amt integer;
BEGIN
  IF NEW.status::text IN ('returned','completed') AND COALESCE(OLD.status::text,'') NOT IN ('returned','completed') AND NEW.credit_awarded = 0 THEN
    SELECT credit_reward_mode, credit_reward_value, credit_expiry_days, name
      INTO _p FROM public.products WHERE id = NEW.product_id;
    IF _p.credit_reward_mode = 'none' OR _p.credit_reward_value <= 0 THEN RETURN NEW; END IF;
    _base := NEW.total_price;
    _amt := public.compute_credit_reward(_p.credit_reward_mode, _p.credit_reward_value, _base);
    IF _amt > 0 THEN
      PERFORM public.award_credit(NEW.user_id, _amt, 'product_rental',
        'Kredit dari rental: ' || COALESCE(_p.name,''),
        'gear_rentals', NEW.id, _p.credit_expiry_days);
      NEW.credit_awarded := _amt;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER award_credit_on_rental_returned
BEFORE UPDATE ON public.gear_rentals
FOR EACH ROW EXECUTE FUNCTION public.trg_award_credit_on_rental_returned();

-- 12. Updated_at trigger for wallet_settings
CREATE TRIGGER update_wallet_settings_updated_at
BEFORE UPDATE ON public.wallet_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
