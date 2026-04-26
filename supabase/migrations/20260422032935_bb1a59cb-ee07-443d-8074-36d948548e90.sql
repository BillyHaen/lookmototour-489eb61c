-- Replace product policies to use has_vendor_access() so linked-vendor owners (without explicit role) also work
DROP POLICY IF EXISTS "Vendors view own products" ON public.products;
DROP POLICY IF EXISTS "Vendors insert own products" ON public.products;
DROP POLICY IF EXISTS "Vendors update own products" ON public.products;
DROP POLICY IF EXISTS "Vendors delete own products" ON public.products;

CREATE POLICY "Vendors view own products"
ON public.products FOR SELECT TO authenticated
USING (public.has_vendor_access() AND vendor_id = public.get_my_vendor_id());

CREATE POLICY "Vendors insert own products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_vendor_access() AND vendor_id = public.get_my_vendor_id());

CREATE POLICY "Vendors update own products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_vendor_access() AND vendor_id = public.get_my_vendor_id())
WITH CHECK (public.has_vendor_access() AND vendor_id = public.get_my_vendor_id());

CREATE POLICY "Vendors delete own products"
ON public.products FOR DELETE TO authenticated
USING (public.has_vendor_access() AND vendor_id = public.get_my_vendor_id());

-- Also update the trigger that auto-fills vendor_id so linked vendors get it too
CREATE OR REPLACE FUNCTION public.force_vendor_id_for_vendor_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _my_vid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND public.has_vendor_access() THEN
    SELECT public.get_my_vendor_id() INTO _my_vid;
    IF _my_vid IS NULL THEN
      RAISE EXCEPTION 'Vendor account not linked to any vendor record';
    END IF;
    NEW.vendor_id := _my_vid;
  END IF;
  RETURN NEW;
END;
$$;