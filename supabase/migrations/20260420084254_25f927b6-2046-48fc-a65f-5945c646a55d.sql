CREATE OR REPLACE FUNCTION public.recommend_rental_gear(_event_id uuid, _motor_type text DEFAULT ''::text, _motor_brand text DEFAULT ''::text)
 RETURNS TABLE(product_id uuid, name text, description text, image_url text, daily_rent_price integer, rent_deposit integer, gear_type text, vendor_id uuid, vendor_name text, vendor_logo_url text, available_qty integer, trip_days integer, subtotal integer, score integer, reason jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _ev RECORD;
  _days INT;
BEGIN
  SELECT e.touring_style, e.difficulty, e.date, e.end_date
  INTO _ev
  FROM public.events e WHERE e.id = _event_id;

  _days := GREATEST(
    COALESCE(EXTRACT(DAY FROM (COALESCE(_ev.end_date, _ev.date) - _ev.date))::INT, 0) + 1,
    1
  );

  RETURN QUERY
  WITH scored AS (
    SELECT
      p.id AS p_id,
      p.name AS p_name,
      p.description AS p_description,
      p.image_url AS p_image_url,
      p.daily_rent_price AS p_daily_rent_price,
      p.rent_deposit AS p_rent_deposit,
      p.gear_type AS p_gear_type,
      p.vendor_id AS p_vendor_id,
      v.name AS v_name,
      v.logo_url AS v_logo_url,
      GREATEST(
        p.total_inventory - p.sold_count -
        COALESCE((
          SELECT SUM(gr.qty) FROM public.gear_rentals gr
          WHERE gr.product_id = p.id
            AND gr.status IN ('confirmed','picked_up')
            AND NOT (gr.end_date < _ev.date::date OR gr.start_date > COALESCE(_ev.end_date, _ev.date)::date)
        ), 0),
        0
      )::INT AS avail_qty,
      _days AS trip_days_v,
      (p.daily_rent_price * _days)::INT AS subtotal_v,
      (
        CASE WHEN _motor_type <> '' AND _motor_type = ANY(p.suitable_motor_types) THEN 10 ELSE 0 END +
        CASE WHEN _motor_brand <> '' AND LOWER(_motor_brand) = ANY(SELECT LOWER(x) FROM unnest(p.motor_brands) x) THEN 5 ELSE 0 END +
        CASE WHEN _ev.touring_style = ANY(p.suitable_trip_styles) THEN 8 ELSE 0 END +
        CASE WHEN public.difficulty_to_int(_ev.difficulty) >= p.min_difficulty THEN 5 ELSE 0 END +
        CASE WHEN p.gear_type IN ('helmet','jacket') AND _days > 1 THEN 3 ELSE 0 END +
        CASE WHEN p.gear_type = 'luggage' AND _days > 1 THEN 2 ELSE 0 END
      ) AS score_v,
      jsonb_build_object(
        'motor_type_match', _motor_type = ANY(p.suitable_motor_types),
        'brand_match', _motor_brand <> '' AND LOWER(_motor_brand) = ANY(SELECT LOWER(x) FROM unnest(p.motor_brands) x),
        'trip_style_match', _ev.touring_style = ANY(p.suitable_trip_styles),
        'difficulty_ok', public.difficulty_to_int(_ev.difficulty) >= p.min_difficulty,
        'trip_days', _days
      ) AS reason_v
    FROM public.products p
    LEFT JOIN public.vendors v ON v.id = p.vendor_id
    WHERE p.is_active = true
      AND p.is_rentable = true
      AND p.daily_rent_price > 0
  )
  SELECT
    s.p_id,
    s.p_name,
    s.p_description,
    s.p_image_url,
    s.p_daily_rent_price,
    s.p_rent_deposit,
    s.p_gear_type,
    s.p_vendor_id,
    s.v_name,
    s.v_logo_url,
    s.avail_qty,
    s.trip_days_v,
    s.subtotal_v,
    s.score_v,
    s.reason_v
  FROM scored s
  WHERE s.avail_qty > 0
  ORDER BY s.score_v DESC, s.p_daily_rent_price ASC
  LIMIT 6;
END;
$function$;