import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InterestedUser {
  user_id: string;
  name: string;
  avatar_url: string | null;
}

export default function InterestedUsers({ eventId }: { eventId: string }) {
  const { user } = useAuth();

  const { data: interestedUsers } = useQuery({
    queryKey: ['event-interested-users', eventId],
    queryFn: async () => {
      // Get interests for this event
      const { data: interests, error } = await supabase
        .from('event_interests')
        .select('user_id, name')
        .eq('event_id', eventId);
      if (error || !interests || interests.length === 0) return [];

      // Get public profiles for these users
      const profiles: InterestedUser[] = [];
      for (const interest of interests) {
        const { data } = await supabase.rpc('get_public_profile', { _user_id: interest.user_id });
        if (data && data.length > 0) {
          profiles.push({
            user_id: data[0].user_id,
            name: data[0].name || interest.name,
            avatar_url: data[0].avatar_url,
          });
        } else {
          profiles.push({
            user_id: interest.user_id,
            name: interest.name || 'Member',
            avatar_url: null,
          });
        }
      }
      return profiles;
    },
    enabled: !!user && !!eventId,
  });

  if (!user || !interestedUsers || interestedUsers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Heart className="h-4 w-4 text-destructive" />
        <span>{interestedUsers.length} orang berminat</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {interestedUsers.map((u) => (
          <Link
            key={u.user_id}
            to={`/member/${u.user_id}`}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={u.avatar_url || undefined} alt={u.name} />
              <AvatarFallback className="text-xs">{u.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium truncate max-w-[80px]">{u.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
