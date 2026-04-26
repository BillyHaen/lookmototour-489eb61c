import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import TrustBadge, { getTrustTier } from './TrustBadge';
import FollowButton from './FollowButton';
import RiderShareButton from './RiderShareButton';
import AvatarUpload from '@/components/AvatarUpload';
import BannerUpload from '@/components/BannerUpload';
import UserAvatar from '@/components/UserAvatar';
import { MapPin, Bike, Pencil } from 'lucide-react';
import type { RiderProfile } from '@/hooks/useRider';

const STYLE_LABEL: Record<string, string> = {
  santai: 'Santai',
  adventure: 'Adventure',
  touring: 'Touring',
  racing: 'Racing',
};

const compactFmt = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });
const formatCount = (n: number) => compactFmt.format(n || 0);

export default function RiderHeader({ rider, isOwner = false }: { rider: RiderProfile; isOwner?: boolean }) {
  return (
    <header className="border-b border-border">
      {/* Cover Banner */}
      <div className="relative w-full bg-gradient-to-br from-primary/40 via-accent/30 to-primary/20 overflow-hidden sm:rounded-b-xl aspect-[16/9] sm:aspect-[2.6/1] max-h-[360px]">
        {rider.banner_url && (
          <img src={rider.banner_url} alt={`Banner ${rider.name}`} className="w-full h-full object-cover" />
        )}
        {isOwner && (
          <div className="absolute bottom-3 right-3 z-10">
            <BannerUpload userId={rider.user_id} currentUrl={rider.banner_url} variant="inline" />
          </div>
        )}
      </div>

      {/* Avatar + Info */}
      <div className="container px-4 sm:px-6 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
          {/* Avatar (overlap banner) */}
          <div className="relative -mt-14 sm:-mt-16 shrink-0 self-start">
            <div className="rounded-full ring-4 ring-background bg-background w-fit">
              {isOwner ? (
                <AvatarUpload
                  userId={rider.user_id}
                  currentUrl={rider.avatar_url}
                  name={rider.name}
                  size="xl"
                  variant="badge"
                />
              ) : (
                <UserAvatar
                  src={rider.avatar_url}
                  name={rider.name}
                  className="h-28 w-28 sm:h-36 sm:w-36 text-3xl [&_img]:object-cover"
                />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 sm:pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-bold text-2xl sm:text-3xl leading-tight break-words">
                {rider.name}
              </h1>
              <TrustBadge score={rider.trust_score} className="text-xs" />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">@{rider.username}</p>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{formatCount(rider.follower_count)}</span> pengikut
              <span className="mx-1.5">·</span>
              <span className="font-semibold text-foreground">{formatCount(rider.following_count)}</span> mengikuti
            </p>
            {rider.bio && (
              <p className="text-sm mt-2 text-foreground/90 line-clamp-2">{rider.bio}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
              {rider.riding_style && (
                <span className="inline-flex items-center gap-1">
                  <Bike className="h-3 w-3" />{STYLE_LABEL[rider.riding_style] || rider.riding_style}
                </span>
              )}
              {rider.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{rider.location}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="sm:pb-2 w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            {isOwner ? (
              <Button asChild size="sm" className="gap-1.5 w-full sm:w-auto">
                <Link to="/profile"><Pencil className="h-4 w-4" />Edit Profil</Link>
              </Button>
            ) : (
              <div className="w-full sm:w-auto [&>button]:w-full sm:[&>button]:w-auto">
                <FollowButton targetUserId={rider.user_id} />
              </div>
            )}
            <RiderShareButton
              rider={rider}
              badge={getTrustTier(rider.trust_score).label}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
