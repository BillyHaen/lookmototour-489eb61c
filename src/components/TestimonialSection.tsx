import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Quote } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

export default function TestimonialSection() {
  const { data: testimonials } = useQuery({
    queryKey: ['approved-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_approved_testimonials_with_profiles');
      if (error) throw error;
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t: any) => (
            <div key={t.id} className="relative p-6 rounded-2xl border border-border bg-card shadow-sm">
              <Quote className="absolute top-4 right-4 h-6 w-6 text-muted-foreground/20" />
              <div className="flex items-center gap-3 mb-4">
                <UserAvatar src={t.user_avatar_url} name={t.user_name || 'Rider'} className="h-10 w-10" />
                <div>
                  <p className="font-semibold text-sm">{t.user_name || 'Rider'}</p>
                  <p className="text-xs text-muted-foreground">{t.event_title || 'Event'}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
