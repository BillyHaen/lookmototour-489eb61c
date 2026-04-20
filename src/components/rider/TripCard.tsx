import { Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/data/events';

export default function TripCard({ trip }: { trip: any }) {
  const ev = trip.events;
  if (!ev) return null;
  const isCompleted = ev.status === 'completed';
  return (
    <Link to={`/events/${ev.slug || ev.id}`} className="block rounded-lg border border-border bg-card hover:shadow-md transition overflow-hidden">
      <div className="flex gap-3">
        {ev.image_url && (
          <img src={ev.image_url} alt={ev.title} className="w-24 h-24 object-cover flex-shrink-0" loading="lazy" />
        )}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm line-clamp-2">{ev.title}</h3>
            <Badge variant={isCompleted ? 'default' : 'secondary'} className="text-[10px] flex-shrink-0">
              {isCompleted ? 'Selesai' : ev.status === 'ongoing' ? 'Berlangsung' : 'Mendatang'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location}</p>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(ev.date)}</p>
        </div>
      </div>
    </Link>
  );
}
