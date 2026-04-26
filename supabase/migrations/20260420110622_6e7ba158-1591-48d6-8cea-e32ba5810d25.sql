CREATE OR REPLACE FUNCTION public.get_product_availability(_product_id uuid, _start_date date DEFAULT CURRENT_DATE, _end_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(total_inventory integer, sold integer, currently_rented integer, available_to_rent integer, available_to_buy integer)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _total INT; _sold INT; _rented INT;
BEGIN
  SELECT p.total_inventory, p.sold_count INTO _total, _sold
  FROM public.products p WHERE p.id = _product_id;

  SELECT COALESCE(SUM(qty),0) INTO _rented
  FROM public.gear_rentals
  WHERE product_id = _product_id
    AND status IN ('pending','confirmed','picked_up')
    AND NOT (end_date < _start_date OR start_date > _end_date);

  RETURN QUERY SELECT
    COALESCE(_total,0),
    COALESCE(_sold,0),
    COALESCE(_rented,0),
    GREATEST(COALESCE(_total,0) - COALESCE(_sold,0) - COALESCE(_rented,0), 0),
    GREATEST(COALESCE(_total,0) - COALESCE(_sold,0) - COALESCE(_rented,0), 0);
END;
$function$;