
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE(
  user_id uuid,
  total_trips bigint,
  total_km numeric,
  total_payments bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    p.user_id,
    COALESCE(r.trip_count, 0) as total_trips,
    COALESCE(r.total_km, 0) as total_km,
    COALESCE(r.total_payments, 0) as total_payments
  FROM public.profiles p
  LEFT JOIN (
    SELECT 
      er.user_id,
      COUNT(*) as trip_count,
      SUM(
        CASE 
          WHEN e.distance IS NOT NULL AND e.distance != '' 
          THEN REGEXP_REPLACE(e.distance, '[^0-9.]', '', 'g')::numeric
          ELSE 0 
        END
      ) as total_km,
      SUM(
        CASE er.registration_type
          WHEN 'couple' THEN e.price_couple
          WHEN 'sharing' THEN e.price_sharing
          ELSE e.price_single
        END
        + CASE WHEN er.towing_pergi THEN e.towing_pergi_price ELSE 0 END
        + CASE WHEN er.towing_pulang THEN e.towing_pulang_price ELSE 0 END
      ) as total_payments
    FROM public.event_registrations er
    JOIN public.events e ON e.id = er.event_id
    WHERE er.status = 'confirmed'
    GROUP BY er.user_id
  ) r ON r.user_id = p.user_id;
$$;
