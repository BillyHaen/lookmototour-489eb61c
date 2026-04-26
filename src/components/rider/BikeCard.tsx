import { Bike, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BikeCard({ bike, isOwner, onEdit, onDelete }: { bike: any; isOwner: boolean; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="aspect-video bg-muted relative">
        {bike.photo_url ? (
          <img src={bike.photo_url} alt={`${bike.brand} ${bike.model}`} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Bike className="h-10 w-10" /></div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm">{bike.brand} {bike.model}</h3>
        {bike.year && <p className="text-xs text-muted-foreground">{bike.year}</p>}
        {bike.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{bike.description}</p>}
        {isOwner && (
          <div className="flex gap-1 mt-2">
            <Button size="sm" variant="outline" onClick={onEdit} className="h-7 text-xs flex-1"><Pencil className="h-3 w-3 mr-1" />Edit</Button>
            <Button size="sm" variant="outline" onClick={onDelete} className="h-7 text-xs"><Trash2 className="h-3 w-3" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
