import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import EventImageUpload from '@/components/EventImageUpload';

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  image_url?: string;
  image_alt?: string;
}

interface Props {
  value: ItineraryDay[];
  onChange: (v: ItineraryDay[]) => void;
}

export default function ItineraryEditor({ value, onChange }: Props) {
  const items = value || [];

  const update = (i: number, patch: Partial<ItineraryDay>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    onChange(next);
  };

  const add = () => {
    onChange([...items, { day: items.length + 1, title: '', description: '', image_url: '', image_alt: '' }]);
  };

  const remove = (i: number) => {
    const next = items.filter((_, idx) => idx !== i).map((it, idx) => ({ ...it, day: idx + 1 }));
    onChange(next);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next.map((it, idx) => ({ ...it, day: idx + 1 })));
  };

  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Hari {it.day}</span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3 w-3" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === items.length - 1}><ArrowDown className="h-3 w-3" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
          <Input placeholder="Judul hari (mis: Welcome Ride – Waingapu to East Sumba)" value={it.title} onChange={(e) => update(i, { title: e.target.value })} />
          <Textarea placeholder="Deskripsi kegiatan hari ini..." rows={3} value={it.description} onChange={(e) => update(i, { description: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <EventImageUpload value={it.image_url || ''} onChange={(url) => update(i, { image_url: url })} />
            <Input placeholder="Alt text gambar (SEO)" value={it.image_alt || ''} onChange={(e) => update(i, { image_alt: e.target.value })} />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-2"><Plus className="h-4 w-4" /> Tambah Hari</Button>
      {!items.length && <p className="text-sm text-muted-foreground text-center py-4">Belum ada itinerary. Klik "Tambah Hari".</p>}
    </div>
  );
}
