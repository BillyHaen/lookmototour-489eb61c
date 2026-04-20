import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserAvatar from '@/components/UserAvatar';

export default function EndorsementCard({ endorsement }: { endorsement: any }) {
  const p = endorsement.from_profile;
  return (
    <div className="rounded-lg border border-border p-4 bg-card">
      <div className="flex items-center gap-2 mb-2">
        <Link to={p?.username ? `/riders/${p.username}` : '#'} className="flex items-center gap-2 hover:underline">
          <UserAvatar src={p?.avatar_url} name={p?.name} className="h-8 w-8" />
          <div>
            <p className="text-sm font-semibold leading-none">{p?.name || 'Rider'}</p>
            {p?.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
          </div>
        </Link>
        <div className="ml-auto flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < endorsement.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
          ))}
        </div>
      </div>
      <p className="text-sm">{endorsement.content}</p>
    </div>
  );
}
