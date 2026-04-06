import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, User, Star, Award, Shield, Flame, Trophy } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';

const BADGES = [
  { min: 1, label: 'Rookie Rider', icon: Star, color: 'text-muted-foreground' },
  { min: 3, label: 'Explorer', icon: Flame, color: 'text-accent' },
  { min: 5, label: 'Road Warrior', icon: Shield, color: 'text-primary' },
  { min: 10, label: 'Legend', icon: Trophy, color: 'text-primary' },
  { min: 20, label: 'Grand Master', icon: Award, color: 'text-primary' },
];

function getBadges(eventCount: number) {
  return BADGES.filter(b => eventCount >= b.min);
}

export default function MemberProfile() {
  const { userId } = useParams();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['member-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: registrationCount } = useQuery({
    queryKey: ['member-event-count', userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('status', 'confirmed');
      if (error) return 0;
      return count || 0;
    },
    enabled: !!userId,
  });

  const { data: testimonials } = useQuery({
    queryKey: ['member-testimonials', userId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('testimonials') as any)
        .select('*, events!testimonials_event_id_fkey(title)')
        .eq('user_id', userId!)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data as any[];
    },
    enabled: !!userId,
  });

  const badges = getBadges(registrationCount || 0);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-20 container text-center">
          <h1 className="font-heading font-bold text-2xl">Member Tidak Ditemukan</h1>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <UserAvatar src={profile.avatar_url} name={profile.name} className="h-24 w-24 mx-auto text-2xl" />

              <div>
                <h1 className="font-heading font-bold text-2xl">{profile.name}</h1>
                {profile.bio && <p className="text-muted-foreground mt-2">{profile.bio}</p>}
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{registrationCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Event Diikuti</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{badges.length}</p>
                  <p className="text-xs text-muted-foreground">Badge</p>
                </div>
              </div>

              {badges.length > 0 && (
                <div>
                  <h3 className="font-heading font-semibold mb-3">Badge</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {badges.map((b) => (
                      <Badge key={b.label} variant="outline" className="gap-1 py-1.5 px-3">
                        <b.icon className={`h-4 w-4 ${b.color}`} />
                        {b.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {testimonials && testimonials.length > 0 && (
                <div className="text-left">
                  <h3 className="font-heading font-semibold mb-3">Testimoni</h3>
                  <div className="space-y-3">
                    {testimonials.map((t: any) => (
                      <div key={t.id} className="p-4 rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground mb-1">{t.events?.title || 'Event'}</p>
                        <div className="flex gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < t.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                        <p className="text-sm">{t.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
