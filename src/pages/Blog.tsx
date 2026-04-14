import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useBlogPosts } from '@/hooks/useBlog';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { Loader2, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function Blog() {
  const { data: posts, isLoading } = useBlogPosts();

  useSeoMeta({
    title: 'Blog - Tips Touring & Cerita Komunitas | LookMotoTour',
    description: 'Baca berita terbaru, tips touring motor, dan cerita inspiratif dari komunitas LookMotoTour.',
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container">
          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">Blog</h1>
          <p className="text-muted-foreground mb-10">Berita, tips touring, dan cerita dari komunitas.</p>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(posts || []).map(post => (
                <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="group">
                  <div className="rounded-xl overflow-hidden border border-border bg-card shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                    {post.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
              ))}
            </div>
          )}
          {!isLoading && (posts || []).length === 0 && (
            <p className="text-center text-muted-foreground py-12">Belum ada artikel.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
