
-- ============ ENUM ============
CREATE TYPE public.gear_rental_status AS ENUM ('pending','confirmed','picked_up','returned','cancelled');

-- ============ VENDORS ============
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  contact_phone TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vendors" ON public.vendors
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage vendors" ON public.vendors
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TRIGGER vendors_updated_at BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PRODUCTS additions ============
ALTER TABLE public.products
  ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN is_rentable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN is_purchasable BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN daily_rent_price INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN rent_deposit INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN total_inventory INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN sold_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN gear_type TEXT DEFAULT '',
  ADD COLUMN suitable_motor_types TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN suitable_trip_styles TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN motor_brands TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN min_difficulty INTEGER NOT NULL DEFAULT 1;

-- Backfill: existing products keep their stock as total_inventory
UPDATE public.products SET total_inventory = stock WHERE total_inventory = 0 AND stock > 0;

CREATE INDEX idx_products_vendor ON public.products(vendor_id);
CREATE INDEX idx_products_rentable ON public.products(is_rentable) WHERE is_rentable = true;

-- ============ GEAR RENTALS ============
CREATE TABLE public.gear_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES public.event_registrations(id) ON DELETE SET NULL,
  qty INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  daily_price INTEGER NOT NULL DEFAULT 0,
  total_days INTEGER NOT NULL DEFAULT 1 CHECK (total_days > 0),
  total_price INTEGER NOT NULL DEFAULT 0,
  deposit_amount INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status public.gear_rental_status NOT NULL DEFAULT 'pending',
  pickup_notes TEXT DEFAULT '',
  return_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
ALTER TABLE public.gear_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own rentals" ON public.gear_rentals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own rentals" ON public.gear_rentals
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own pending rentals" ON public.gear_rentals
  FOR UPDATE TO authenticated
  USING ((user_id = auth.uid() AND status = 'pending') OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete rentals" ON public.gear_rentals
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER gear_rentals_updated_at BEFORE UPDATE ON public.gear_rentals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_gear_rentals_user ON public.gear_rentals(user_id);
CREATE INDEX idx_gear_rentals_product ON public.gear_rentals(product_id);
CREATE INDEX idx_gear_rentals_event ON public.gear_rentals(event_id);
CREATE INDEX idx_gear_rentals_status ON public.gear_rentals(status);
CREATE INDEX idx_gear_rentals_dates ON public.gear_rentals(start_date, end_date);

-- ============ RECOMMENDATIONS LOG ============
CREATE TABLE public.product_recommendations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  reason JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.product_recommendations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own rec log" ON public.product_recommendations_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE INDEX idx_rec_log_user_event ON public.product_recommendations_log(user_id, event_id);

-- ============ RPC: get_product_availability ============
CREATE OR REPLACE FUNCTION public.get_product_availability(
  _product_id UUID,
  _start_date DATE DEFAULT CURRENT_DATE,
  _end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  total_inventory INTEGER,
  sold INTEGER,
  currently_rented INTEGER,
  available_to_rent INTEGER,
  available_to_buy INTEGER
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _total INT; _sold INT; _rented INT;
BEGIN
  SELECT p.total_inventory, p.sold_count INTO _total, _sold
  FROM public.products p WHERE p.id = _product_id;

  SELECT COALESCE(SUM(qty),0) INTO _rented
  FROM public.gear_rentals
  WHERE product_id = _product_id
    AND status IN ('confirmed','picked_up')
    AND NOT (end_date < _start_date OR start_date > _end_date);

  RETURN QUERY SELECT
    COALESCE(_total,0),
    COALESCE(_sold,0),
    COALESCE(_rented,0),
    GREATEST(COALESCE(_total,0) - COALESCE(_sold,0) - COALESCE(_rented,0), 0),
    GREATEST(COALESCE(_total,0) - COALESCE(_sold,0) - COALESCE(_rented,0), 0);
END;
$$;

-- ============ RPC: recommend_rental_gear ============
CREATE OR REPLACE FUNCTION public.recommend_rental_gear(
  _event_id UUID,
  _motor_type TEXT DEFAULT '',
  _motor_brand TEXT DEFAULT ''
)
RETURNS TABLE(
  product_id UUID,
  name TEXT,
  description TEXT,
  image_url TEXT,
  daily_rent_price INTEGER,
  rent_deposit INTEGER,
  gear_type TEXT,
  vendor_id UUID,
  vendor_name TEXT,
  vendor_logo_url TEXT,
  available_qty INTEGER,
  trip_days INTEGER,
  subtotal INTEGER,
  score INTEGER,
  reason JSONB
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
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
      p.id,
      p.name,
      p.description,
      p.image_url,
      p.daily_rent_price,
      p.rent_deposit,
      p.gear_type,
      p.vendor_id,
      v.name AS vendor_name,
      v.logo_url AS vendor_logo_url,
      GREATEST(
        p.total_inventory - p.sold_count -
        COALESCE((
          SELECT SUM(gr.qty) FROM public.gear_rentals gr
          WHERE gr.product_id = p.id
            AND gr.status IN ('confirmed','picked_up')
            AND NOT (gr.end_date < _ev.date::date OR gr.start_date > COALESCE(_ev.end_date, _ev.date)::date)
        ), 0),
        0
      )::INT AS available_qty,
      _days AS trip_days,
      (p.daily_rent_price * _days)::INT AS subtotal,
      (
        CASE WHEN _motor_type <> '' AND _motor_type = ANY(p.suitable_motor_types) THEN 10 ELSE 0 END +
        CASE WHEN _motor_brand <> '' AND LOWER(_motor_brand) = ANY(SELECT LOWER(x) FROM unnest(p.motor_brands) x) THEN 5 ELSE 0 END +
        CASE WHEN _ev.touring_style = ANY(p.suitable_trip_styles) THEN 8 ELSE 0 END +
        CASE WHEN public.difficulty_to_int(_ev.difficulty) >= p.min_difficulty THEN 5 ELSE 0 END +
        CASE WHEN p.gear_type IN ('helmet','jacket') AND _days > 1 THEN 3 ELSE 0 END +
        CASE WHEN p.gear_type = 'luggage' AND _days > 1 THEN 2 ELSE 0 END
      ) AS score,
      jsonb_build_object(
        'motor_type_match', _motor_type = ANY(p.suitable_motor_types),
        'brand_match', _motor_brand <> '' AND LOWER(_motor_brand) = ANY(SELECT LOWER(x) FROM unnest(p.motor_brands) x),
        'trip_style_match', _ev.touring_style = ANY(p.suitable_trip_styles),
        'difficulty_ok', public.difficulty_to_int(_ev.difficulty) >= p.min_difficulty,
        'trip_days', _days
      ) AS reason
    FROM public.products p
    LEFT JOIN public.vendors v ON v.id = p.vendor_id
    WHERE p.is_active = true
      AND p.is_rentable = true
      AND p.daily_rent_price > 0
  )
  SELECT * FROM scored
  WHERE available_qty > 0
  ORDER BY score DESC, daily_rent_price ASC
  LIMIT 6;
END;
$$;

-- helper: difficulty text -> int
CREATE OR REPLACE FUNCTION public.difficulty_to_int(_d TEXT)
RETURNS INTEGER LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE LOWER(COALESCE(_d,''))
    WHEN 'mudah' THEN 1
    WHEN 'sedang' THEN 3
    WHEN 'sulit' THEN 4
    WHEN 'ekstrem' THEN 5
    ELSE 2
  END;
$$;
