import { Shirt, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CAT_LABEL: Record<string, string> = {
  helmet: 'Helm', jacket: 'Jaket', gloves: 'Sarung Tangan', boots: 'Sepatu', luggage: 'Tas/Box', other: 'Lainnya',
};

export default function GearCard({ gear, isOwner, onEdit, onDelete }: { gear: any; isOwner: boolean; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="aspect-square bg-muted relative">
        {gear.photo_url ? (
          <img src={gear.photo_url} alt={`${gear.brand} ${gear.name}`} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Shirt className="h-10 w-10" /></div>
        )}
        <Badge variant="secondary" className="absolute top-1.5 left-1.5 text-[10px]">{CAT_LABEL[gear.category] || gear.category}</Badge>
      </div>
      <div className="p-2.5">
        <p className="font-semibold text-xs line-clamp-1">{gear.brand}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{gear.name}</p>
        {isOwner && (
          <div className="flex gap-1 mt-1.5">
            <Button size="sm" variant="outline" onClick={onEdit} className="h-6 text-[10px] flex-1 px-1"><Pencil className="h-2.5 w-2.5" /></Button>
            <Button size="sm" variant="outline" onClick={onDelete} className="h-6 text-[10px] px-1"><Trash2 className="h-2.5 w-2.5" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
