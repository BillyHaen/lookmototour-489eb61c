import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Wallet, CalendarDays, Navigation, BadgeCheck, ExternalLink } from 'lucide-react';
import AvatarUpload from '@/components/AvatarUpload';
import StatCard from './StatCard';
import { formatPrice } from '@/data/events';

interface ProfileHeroProps {
  userId: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  confirmedCount: number;
  walletBalance: number;
  activeSessions: number;
  onLogout: () => void;
}

export default function ProfileHero({
  userId, name, username, avatarUrl, confirmedCount, walletBalance, activeSessions, onLogout,
}: ProfileHeroProps) {
  const isPro = confirmedCount >= 5;
  const displayName = name || 'Rider';

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 shadow-sm p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-4 min-w-0">
          <AvatarUpload userId={userId} currentUrl={avatarUrl} name={name || undefined} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-bold text-2xl sm:text-3xl leading-tight truncate">
                {displayName}
              </h1>
              {username && (
                <Badge variant="default" className="gap-1 bg-primary/15 text-primary hover:bg-primary/20 border-0">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {isPro ? 'Pro Member' : 'Verified'}
                </Badge>
              )}
            </div>
            {username ? (
              <Link
                to={`/riders/${username}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mt-0.5"
              >
                @{username} <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">Set username di tab Pengaturan</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2 shrink-0">
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Wallet} label="Kredit" value={formatPrice(walletBalance)} />
        <StatCard icon={CalendarDays} label="Total Events" value={confirmedCount} />
        <StatCard
          icon={Navigation}
          label="Tracking Aktif"
          value={activeSessions}
          accent={activeSessions > 0 ? 'emerald' : 'primary'}
          pulse={activeSessions > 0}
        />
      </div>
    </div>
  );
}
