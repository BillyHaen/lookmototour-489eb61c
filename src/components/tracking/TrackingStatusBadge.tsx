import { Badge } from '@/components/ui/badge';
import { Circle } from 'lucide-react';

export default function TrackingStatusBadge({ status, expiresAt }: { status: string; expiresAt?: string }) {
  const expired = expiresAt && new Date(expiresAt) < new Date();
  const isActive = status === 'active' && !expired;
  return (
    <Badge variant={isActive ? 'default' : 'secondary'} className="gap-1.5">
      <Circle className={`h-2 w-2 ${isActive ? 'fill-current animate-pulse' : 'fill-current'}`} />
      {isActive ? 'Aktif' : expired ? 'Kadaluarsa' : 'Selesai'}
    </Badge>
  );
}
