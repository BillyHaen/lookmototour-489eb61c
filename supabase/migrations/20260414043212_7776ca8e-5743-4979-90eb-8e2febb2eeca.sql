
-- Blog Posts
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  excerpt text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  author_id uuid NOT NULL,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_blog_posts_slug ON public.blog_posts (slug) WHERE slug != '';

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can view all posts" ON public.blog_posts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert posts" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update posts" ON public.blog_posts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete posts" ON public.blog_posts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Blog Comments
CREATE TABLE public.blog_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_comments_post_id ON public.blog_comments(post_id);
CREATE INDEX idx_blog_comments_parent_id ON public.blog_comments(parent_id);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments on published posts" ON public.blog_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.blog_posts WHERE id = post_id AND status = 'published')
);
CREATE POLICY "Admins can view all comments" ON public.blog_comments FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create comments" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own comments" ON public.blog_comments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.blog_comments FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can delete any comment" ON public.blog_comments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON public.blog_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trip Journals
CREATE TABLE public.trip_journals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  event_id uuid REFERENCES public.events(id),
  status text NOT NULL DEFAULT 'draft',
  author_id uuid NOT NULL,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_trip_journals_slug ON public.trip_journals (slug) WHERE slug != '';

ALTER TABLE public.trip_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published journals" ON public.trip_journals FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can view all journals" ON public.trip_journals FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert journals" ON public.trip_journals FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update journals" ON public.trip_journals FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete journals" ON public.trip_journals FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_trip_journals_updated_at BEFORE UPDATE ON public.trip_journals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trip Journal Images
CREATE TABLE public.trip_journal_images (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id uuid NOT NULL REFERENCES public.trip_journals(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_journal_images_journal_id ON public.trip_journal_images(journal_id);

ALTER TABLE public.trip_journal_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view images of published journals" ON public.trip_journal_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trip_journals WHERE id = journal_id AND status = 'published')
);
CREATE POLICY "Admins can view all journal images" ON public.trip_journal_images FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert journal images" ON public.trip_journal_images FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update journal images" ON public.trip_journal_images FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete journal images" ON public.trip_journal_images FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Trip Journal Participants
CREATE TABLE public.trip_journal_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id uuid NOT NULL REFERENCES public.trip_journals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(journal_id, user_id)
);

CREATE INDEX idx_trip_journal_participants_journal_id ON public.trip_journal_participants(journal_id);

ALTER TABLE public.trip_journal_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants of published journals" ON public.trip_journal_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.trip_journals WHERE id = journal_id AND status = 'published')
);
CREATE POLICY "Admins can view all participants" ON public.trip_journal_participants FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert participants" ON public.trip_journal_participants FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete participants" ON public.trip_journal_participants FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Storage bucket for journal images
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-images', 'journal-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view journal images" ON storage.objects FOR SELECT USING (bucket_id = 'journal-images');
CREATE POLICY "Admins can upload journal images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'journal-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete journal images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'journal-images' AND public.has_role(auth.uid(), 'admin'));

-- Storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Admins can upload blog images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete blog images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));
