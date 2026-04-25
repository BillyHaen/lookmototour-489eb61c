-- Split sensitive vendor contact info into a private table
CREATE TABLE public.vendor_private (
  vendor_id uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  contact_phone text DEFAULT '',
  contact_email text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_private ENABLE ROW LEVEL SECURITY;

-- Migrate existing data
INSERT INTO public.vendor_private (vendor_id, contact_phone, contact_email)
SELECT id, COALESCE(contact_phone, ''), COALESCE(contact_email, '')
FROM public.vendors;

-- Drop sensitive columns from public table
ALTER TABLE public.vendors DROP COLUMN contact_phone;
ALTER TABLE public.vendors DROP COLUMN contact_email;

-- RLS: only the vendor owner and admins can read/write contact info
CREATE POLICY "Owner reads vendor private"
  ON public.vendor_private FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_private.vendor_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "Owner upserts vendor private"
  ON public.vendor_private FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_private.vendor_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "Owner updates vendor private"
  ON public.vendor_private FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_private.vendor_id AND v.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = vendor_private.vendor_id AND v.owner_user_id = auth.uid()));

CREATE POLICY "Admins manage vendor private"
  ON public.vendor_private FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RPC: renter can get vendor contact only if they have a rental for that vendor's product
CREATE OR REPLACE FUNCTION public.get_vendor_contact_for_renter(_vendor_id uuid)
RETURNS TABLE(contact_phone text, contact_email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.gear_rentals gr
    JOIN public.products p ON p.id = gr.product_id
    WHERE gr.user_id = auth.uid()
      AND p.vendor_id = _vendor_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT vp.contact_phone, vp.contact_email
  FROM public.vendor_private vp
  WHERE vp.vendor_id = _vendor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vendor_contact_for_renter(uuid) TO authenticated;