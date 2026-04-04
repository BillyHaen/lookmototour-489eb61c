import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Quote } from 'lucide-react';

export default function TestimonialSection() {
  const { data: testimonials } = useQuery({
    queryKey: ['approved-testimonials'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('testimonials') as any)
        .select('*, profiles!testimonials_user_id_fkey(name, avatar_url), events!testimonials_event_id_fkey(title)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) {
        const { data: fb } = await (supabase.from('testimonials') as any).select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(6);
        return fb as any[];
      }
      return data as any[];
    },
  });

  if (!testimonials?.length) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-3">Apa Kata Mereka?</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Testimoni dari para rider yang sudah mengikuti event kami.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t: any) => (
            <div key={t.id} className="p-6 rounded-xl bg-card shadow-card border border-border hover:shadow-elevated transition-all duration-300">
              <Quote className="h-6 w-6 text-primary/30 mb-3" />
              <p className="text-sm mb-4 line-clamp-4">{t.content}</p>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {(t.profiles?.name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.profiles?.name || 'Rider'}</p>
                  <p className="text-xs text-muted-foreground">{t.events?.title || 'Event'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
