import UserAvatar from '@/components/UserAvatar';
import TrustBadge from './TrustBadge';
import FollowButton from './FollowButton';
import { MapPin, Bike } from 'lucide-react';
import type { RiderProfile } from '@/hooks/useRider';

const STYLE_LABEL: Record<string, string> = {
  santai: 'Santai',
  adventure: 'Adventure',
  touring: 'Touring',
  racing: 'Racing',
};

export default function RiderHeader({ rider }: { rider: RiderProfile }) {
  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-40 sm:h-56 w-full bg-gradient-to-br from-primary/40 via-accent/30 to-primary/20 relative overflow-hidden rounded-b-xl">
        {rider.banner_url && (
          <img src={rider.banner_url} alt={`Banner ${rider.name}`} className="w-full h-full object-cover" />
        )}
      </div>
      {/* Avatar + Info */}
      <div className="container -mt-12 sm:-mt-16 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="rounded-full ring-4 ring-background bg-background w-fit">
            <UserAvatar src={rider.avatar_url} name={rider.name} className="h-24 w-24 sm:h-32 sm:w-32 text-3xl" />
          </div>
          <div className="flex-1 sm:pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-bold text-2xl sm:text-3xl">{rider.name}</h1>
              <TrustBadge score={rider.trust_score} />
            </div>
            <p className="text-sm text-muted-foreground">@{rider.username}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              {rider.riding_style && (
                <span className="inline-flex items-center gap-1"><Bike className="h-3 w-3" />{STYLE_LABEL[rider.riding_style] || rider.riding_style}</span>
              )}
              {rider.location && (
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{rider.location}</span>
              )}
            </div>
          </div>
          <div className="sm:pb-2">
            <FollowButton targetUserId={rider.user_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
