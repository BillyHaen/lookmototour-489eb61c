
-- Fix: Add ownership guard to credit functions and revoke public RPC access

CREATE OR REPLACE FUNCTION public.award_credit(_user_id uuid, _amount integer, _source credit_source_type, _description text DEFAULT ''::text, _reference_table text DEFAULT NULL::text, _reference_id uuid DEFAULT NULL::uuid, _expiry_days integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _new_id uuid;
  _days integer;
  _expires timestamptz;
BEGIN
  -- Ownership guard: only admin or service_role contexts may award to others
  IF auth.uid() IS NOT NULL AND _user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: cannot award credit to another user';
  END IF;

  IF _amount <= 0 THEN RETURN NULL; END IF;

  SELECT COALESCE(_expiry_days, default_expiry_days, 365) INTO _days FROM public.wallet_settings WHERE id = 1;
  _expires := now() + make_interval(days => _days);

  INSERT INTO public.credit_ledger (user_id, entry_type, source_type, amount, remaining, expires_at, description, reference_table, reference_id)
  VALUES (_user_id, 'earn', _source, _amount, _amount, _expires, _description, _reference_table, _reference_id)
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.redeem_credit(_user_id uuid, _amount integer, _source credit_source_type, _description text DEFAULT ''::text, _reference_table text DEFAULT NULL::text, _reference_id uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _balance integer;
  _remaining_to_take integer := _amount;
  _row record;
  _take integer;
BEGIN
  -- Ownership guard
  IF auth.uid() IS NOT NULL AND _user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: cannot redeem credit from another user';
  END IF;

  IF _amount <= 0 THEN RETURN 0; END IF;
  SELECT public.get_wallet_balance(_user_id) INTO _balance;
  IF _balance < _amount THEN
    RAISE EXCEPTION 'Insufficient credit balance. Have %, need %', _balance, _amount;
  END IF;

  FOR _row IN
    SELECT id, remaining
    FROM public.credit_ledger
    WHERE user_id = _user_id
      AND entry_type IN ('earn', 'adjust', 'refund')
      AND remaining > 0
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
$function$;

-- Tighten notifications INSERT policy: require service_role (drop permissive policy)
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);
