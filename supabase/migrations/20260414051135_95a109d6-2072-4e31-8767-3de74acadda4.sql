
CREATE TABLE public.share_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_type, content_id)
);

ALTER TABLE public.share_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view share counts"
ON public.share_counts FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert share counts"
ON public.share_counts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update share counts"
ON public.share_counts FOR UPDATE
USING (true);

CREATE OR REPLACE FUNCTION public.increment_share_count(_content_type TEXT, _content_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.share_counts (content_type, content_id, count)
  VALUES (_content_type, _content_id, 1)
  ON CONFLICT (content_type, content_id)
  DO UPDATE SET count = share_counts.count + 1, updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;
