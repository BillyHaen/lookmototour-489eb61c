import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import TrustBadge from '@/components/rider/TrustBadge';
import { Users } from 'lucide-react';

interface Props {
  eventId: string;
}

interface Participant {
  user_id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  trust_score: number;
}

export default function TripParticipants({ eventId }: Props) {
  const { data: participants = [] } = useQuery({
    queryKey: ['trip-participants', eventId],
    queryFn: async (): Promise<Participant[]> => {
      // Get confirmed registration user_ids
      const { data: regs } = await supabase
        .from('event_registrations')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'confirmed');
      if (!regs || regs.length === 0) return [];
      const userIds = Array.from(new Set(regs.map((r: any) => r.user_id)));

      // Fetch only riders that have a public username
      const results: Participant[] = [];
      for (const uid of userIds) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('user_id, name, username, avatar_url, trust_score')
          .eq('user_id', uid)
          .not('username', 'is', null)
          .maybeSingle();
        if (prof) results.push(prof as any);
      }
      return results;
    },
    enabled: !!eventId,
  });

  if (participants.length === 0) return null;

  return (
    <section className="border-t border-border pt-10 mt-10">
      <h2 className="font-heading font-bold text-2xl md:text-3xl mb-2 flex items-center gap-2">
        <Users className="h-6 w-6 text-primary" /> Riders yang Ikut Trip Ini
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        {participants.length} rider sudah konfirmasi keberangkatan
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {participants.map((p) => (
          <Link
            key={p.user_id}
            to={`/riders/${p.username}`}
            className="flex flex-col items-center text-center p-3 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-card transition-all"
          >
            <Avatar className="h-14 w-14 mb-2">
              <AvatarImage src={p.avatar_url || undefined} alt={p.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{p.name?.[0]?.toUpperCase() || 'R'}</AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium truncate w-full">{p.name}</p>
            <p className="text-xs text-muted-foreground truncate w-full">@{p.username}</p>
            <div className="mt-1.5"><TrustBadge score={p.trust_score} /></div>
          </Link>
        ))}
      </div>
    </section>
  );
}
