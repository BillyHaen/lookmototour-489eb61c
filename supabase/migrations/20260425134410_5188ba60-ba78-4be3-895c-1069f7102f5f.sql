-- Fix: include positive 'adjust' entries in balance & FIFO redemption
CREATE OR REPLACE FUNCTION public.get_wallet_balance(_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(SUM(remaining), 0)::integer
  FROM public.credit_ledger
  WHERE user_id = _user_id
    AND entry_type IN ('earn', 'adjust', 'refund')
    AND remaining > 0
    AND (expires_at IS NULL OR expires_at > now());
$$;

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
$$;