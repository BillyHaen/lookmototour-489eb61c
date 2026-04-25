DROP POLICY IF EXISTS "Vendors view rentals of own products" ON public.gear_rentals;
DROP POLICY IF EXISTS "Vendors update rentals of own products" ON public.gear_rentals;

CREATE POLICY "Vendors view rentals of own products"
ON public.gear_rentals
FOR SELECT
TO authenticated
USING (
  public.has_vendor_access()
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = gear_rentals.product_id
      AND p.vendor_id = public.get_my_vendor_id()
  )
);

CREATE POLICY "Vendors update rentals of own products"
ON public.gear_rentals
FOR UPDATE
TO authenticated
USING (
  public.has_vendor_access()
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = gear_rentals.product_id
      AND p.vendor_id = public.get_my_vendor_id()
  )
)
WITH CHECK (
  public.has_vendor_access()
  AND EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = gear_rentals.product_id
      AND p.vendor_id = public.get_my_vendor_id()
  )
);