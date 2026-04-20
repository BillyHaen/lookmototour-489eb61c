import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowUp, ArrowDown, Map as MapIcon } from 'lucide-react';
import EventImageUpload from '@/components/EventImageUpload';

export interface ItineraryDayRoute {
  start?: string;
  end?: string;
  distance_km?: number;
  gmaps_url?: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  image_url?: string;
  image_alt?: string;
  route?: ItineraryDayRoute;
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

  const updateRoute = (i: number, patch: Partial<ItineraryDayRoute>) => {
    const current = items[i].route || {};
    const nextRoute = { ...current, ...patch };
    // strip empty
    const cleaned: ItineraryDayRoute = {};
    if (nextRoute.start) cleaned.start = nextRoute.start;
    if (nextRoute.end) cleaned.end = nextRoute.end;
    if (nextRoute.distance_km && nextRoute.distance_km > 0) cleaned.distance_km = nextRoute.distance_km;
    if (nextRoute.gmaps_url) cleaned.gmaps_url = nextRoute.gmaps_url;
    update(i, { route: Object.keys(cleaned).length ? cleaned : undefined });
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

          {/* Per-day Route */}
          <div className="rounded-md border border-dashed border-border p-3 space-y-2 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <MapIcon className="h-3 w-3" /> Rute Hari Ini (opsional)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input
                placeholder="Start (mis: Waingapu)"
                value={it.route?.start || ''}
                onChange={(e) => updateRoute(i, { start: e.target.value })}
              />
              <Input
                placeholder="End (mis: Praile Liang)"
                value={it.route?.end || ''}
                onChange={(e) => updateRoute(i, { end: e.target.value })}
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Jarak (km)"
                value={it.route?.distance_km ?? ''}
                onChange={(e) => updateRoute(i, { distance_km: e.target.value ? Number(e.target.value) : undefined })}
              />
              <Input
                placeholder="Google Maps URL (opsional)"
                value={it.route?.gmaps_url || ''}
                onChange={(e) => updateRoute(i, { gmaps_url: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-2"><Plus className="h-4 w-4" /> Tambah Hari</Button>
      {!items.length && <p className="text-sm text-muted-foreground text-center py-4">Belum ada itinerary. Klik "Tambah Hari".</p>}
    </div>
  );
}
