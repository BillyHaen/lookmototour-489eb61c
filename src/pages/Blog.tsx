import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useBlogPosts } from '@/hooks/useBlog';
import { useCategories, useTags } from '@/hooks/useBlogTaxonomy';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { Loader2, CalendarDays, X } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Blog() {
  const { data: posts, isLoading } = useBlogPosts();
  const { data: categories } = useCategories();
  const { data: tags } = useTags();

  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const { data: postCatLinks } = useQuery({
    queryKey: ['public-post-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('blog_post_categories').select('post_id, category_id');
      return data || [];
    },
  });
  const { data: postTagLinks } = useQuery({
    queryKey: ['public-post-tags'],
    queryFn: async () => {
      const { data } = await supabase.from('blog_post_tags').select('post_id, tag_id');
      return data || [];
    },
  });

  useSeoMeta({
    title: 'Blog - Tips Touring & Cerita Komunitas | LookMotoTour',
    description: 'Baca berita terbaru, tips touring motor, dan cerita inspiratif dari komunitas LookMotoTour.',
  });

  const filtered = useMemo(() => {
    return (posts || []).filter((p: any) => {
      if (selectedCat && !(postCatLinks || []).some((l: any) => l.post_id === p.id && l.category_id === selectedCat)) return false;
      if (selectedTag && !(postTagLinks || []).some((l: any) => l.post_id === p.id && l.tag_id === selectedTag)) return false;
      return true;
    });
  }, [posts, selectedCat, selectedTag, postCatLinks, postTagLinks]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container">
          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">Blog</h1>
          <p className="text-muted-foreground mb-6">Berita, tips touring, dan cerita dari komunitas.</p>

          {/* Filter chips */}
          {(categories?.length || tags?.length) ? (
            <div className="space-y-2 mb-8">
              {!!categories?.length && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-muted-foreground self-center mr-1">Kategori:</span>
                  {categories.map(c => (
                    <Badge
                      key={c.id}
                      variant={selectedCat === c.id ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCat(selectedCat === c.id ? null : c.id)}
                    >
                      {c.name}
                    </Badge>
                  ))}
                </div>
              )}
              {!!tags?.length && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium text-muted-foreground self-center mr-1">Tag:</span>
                  {tags.map(t => (
                    <Badge
                      key={t.id}
                      variant={selectedTag === t.id ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedTag(selectedTag === t.id ? null : t.id)}
                    >
                      #{t.name}
                    </Badge>
                  ))}
                </div>
              )}
              {(selectedCat || selectedTag) && (
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setSelectedCat(null); setSelectedTag(null); }}>
                  <X className="h-3 w-3" /> Reset filter
                </Button>
              )}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post: any) => {
                const gallery = Array.isArray(post.gallery) ? post.gallery : [];
                const cover = post.image_url || gallery[0]?.image_url || null;
                return (
                  <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="group">
                    <div className="rounded-xl overflow-hidden border border-border bg-card shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                      {cover && (
                        <div className="aspect-video overflow-hidden bg-muted">
                          <img src={cover} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <CalendarDays className="h-3 w-3" />
                          {post.published_at ? format(new Date(post.published_at), 'dd MMM yyyy') : format(new Date(post.created_at), 'dd MMM yyyy')}
                        </div>
                        <h2 className="font-heading font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{post.title}</h2>
                        {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {!isLoading && filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Tidak ada artikel yang cocok.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
