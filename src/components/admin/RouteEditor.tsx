import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Trash2, Plus, Map as MapIcon } from 'lucide-react';
import { parseGPX, WAYPOINT_META, type RouteData, type WaypointType } from '@/lib/gpxParser';
import { toast } from '@/hooks/use-toast';
import RouteMap from '@/components/RouteMap';

interface RouteEditorProps {
  value: RouteData | null;
  onChange: (data: RouteData | null) => void;
}

export default function RouteEditor({ value, onChange }: RouteEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [newWp, setNewWp] = useState({ lat: '', lng: '', name: '', type: 'viewpoint' as WaypointType, description: '' });

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseGPX(text);
      onChange({ ...parsed, waypoints: [...(value?.waypoints || []), ...parsed.waypoints] });
      toast({ title: 'GPX berhasil diimport ✅', description: `${parsed.polyline.length} titik track, ${parsed.stats?.distance} km` });
    } catch (e: any) {
      toast({ title: 'Gagal parse GPX', description: e.message, variant: 'destructive' });
    }
  };

  const addWaypoint = () => {
    const lat = parseFloat(newWp.lat);
    const lng = parseFloat(newWp.lng);
    if (isNaN(lat) || isNaN(lng)) {
      toast({ title: 'Koordinat tidak valid', variant: 'destructive' });
      return;
    }
    if (!newWp.name.trim()) {
      toast({ title: 'Nama waypoint harus diisi', variant: 'destructive' });
      return;
    }
    const updated: RouteData = {
      polyline: value?.polyline || [],
      elevation: value?.elevation || [],
      waypoints: [...(value?.waypoints || []), { lat, lng, name: newWp.name, type: newWp.type, description: newWp.description }],
      start: value?.start,
      end: value?.end,
      stats: value?.stats,
    };
    onChange(updated);
    setNewWp({ lat: '', lng: '', name: '', type: 'viewpoint', description: '' });
  };

  const removeWaypoint = (index: number) => {
    if (!value) return;
    onChange({ ...value, waypoints: value.waypoints.filter((_, i) => i !== index) });
  };

  const clearAll = () => {
    if (confirm('Hapus semua data rute?')) onChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept=".gpx,application/gpx+xml,application/xml,text/xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" /> Upload GPX
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            <Trash2 className="h-4 w-4 mr-1" /> Hapus Semua
          </Button>
        )}
        <a
          href="https://www.gpsies.com/createTrack.do"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground self-center underline"
        >
          Cara buat GPX?
        </a>
      </div>

      {value && value.stats && (
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded bg-muted">📏 {value.stats.distance} km</div>
          <div className="p-2 rounded bg-muted">↑ {value.stats.gain} m</div>
          <div className="p-2 rounded bg-muted">↓ {value.stats.loss} m</div>
        </div>
      )}

      {value && value.polyline.length > 0 && <RouteMap data={value} height={240} />}

      {!value && (
        <div className="p-6 border-2 border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
          <MapIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Belum ada data rute. Upload file GPX untuk memulai.
        </div>
      )}

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-sm font-medium">Tambah Titik Penting (POI)</p>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Latitude (-7.95)" value={newWp.lat} onChange={(e) => setNewWp({ ...newWp, lat: e.target.value })} />
          <Input placeholder="Longitude (112.61)" value={newWp.lng} onChange={(e) => setNewWp({ ...newWp, lng: e.target.value })} />
        </div>
        <Input placeholder="Nama (cth: Penanjakan Bromo)" value={newWp.name} onChange={(e) => setNewWp({ ...newWp, name: e.target.value })} />
        <Input placeholder="Deskripsi (opsional)" value={newWp.description} onChange={(e) => setNewWp({ ...newWp, description: e.target.value })} />
        <div className="flex gap-2">
          <Select value={newWp.type} onValueChange={(v) => setNewWp({ ...newWp, type: v as WaypointType })}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['viewpoint', 'resto', 'spbu', 'penginapan'] as WaypointType[]).map((t) => (
                <SelectItem key={t} value={t}>{WAYPOINT_META[t].icon} {WAYPOINT_META[t].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addWaypoint} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Tambah
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Cari koordinat di Google Maps: klik kanan di lokasi → klik koordinat untuk copy.
        </p>
      </div>

      {value && value.waypoints.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Daftar Waypoint ({value.waypoints.length})</p>
          {value.waypoints.map((wp, i) => (
            <div key={i} className="flex items-center justify-between gap-2 p-2 rounded bg-muted text-sm">
              <span className="truncate">
                {WAYPOINT_META[wp.type].icon} <strong>{wp.name}</strong>
                <span className="text-xs text-muted-foreground ml-2">({wp.lat.toFixed(4)}, {wp.lng.toFixed(4)})</span>
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeWaypoint(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
