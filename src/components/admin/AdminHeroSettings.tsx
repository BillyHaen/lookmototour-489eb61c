import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Trash2, Upload, X, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ICON_OPTIONS = ['Users', 'MapPin', 'Calendar', 'Map', 'Star', 'Shield', 'Zap', 'Award', 'Globe', 'Compass'];

interface HeroStat {
  icon: string;
  label: string;
  value: string;
}

interface HeroImage {
  url: string;
  alt: string;
}

interface HeroSettings {
  images: HeroImage[];
  stats: HeroStat[];
}

interface Props {
  form: HeroSettings;
  setForm: (v: HeroSettings) => void;
  saveMutation: { mutate: (v: HeroSettings) => void; isPending: boolean };
}

export default function AdminHeroSettings({ form, setForm, saveMutation }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const newImages: HeroImage[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) {
          toast({ title: 'Ukuran file maksimal 10MB', variant: 'destructive' });
          continue;
        }
        const ext = file.name.split('.').pop();
        const fileName = `hero/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('hero-images').upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('hero-images').getPublicUrl(fileName);
        newImages.push({ url: urlData.publicUrl, alt: '' });
      }
      setForm({ ...form, images: [...form.images, ...newImages] });
      toast({ title: `${newImages.length} gambar berhasil diupload ✅` });
    } catch (err: any) {
      toast({ title: 'Gagal upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
  };

  const updateImageAlt = (index: number, alt: string) => {
    const updated = [...form.images];
    updated[index] = { ...updated[index], alt };
    setForm({ ...form, images: updated });
  };

  const addStat = () => {
    setForm({ ...form, stats: [...form.stats, { icon: 'Users', label: '', value: '' }] });
  };

  const updateStat = (index: number, field: keyof HeroStat, value: string) => {
    const updated = [...form.stats];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, stats: updated });
  };

  const removeStat = (index: number) => {
    setForm({ ...form, stats: form.stats.filter((_, i) => i !== index) });
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Hero Banner</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {/* Images */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Banner Images (Scroll Manual)</label>
            <Button type="button" variant="outline" size="sm" className="gap-1" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Tambah
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Upload beberapa gambar untuk hero banner. Pengunjung bisa scroll secara horizontal.</p>

          {form.images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                  <div className="aspect-video">
                    <img src={img.url} alt={img.alt || `Banner ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <Button
                    type="button" variant="destructive" size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <div className="p-2">
                    <Input
                      placeholder="Alt text (untuk SEO)"
                      value={img.alt}
                      onChange={(e) => updateImageAlt(i, e.target.value)}
                      className="text-xs h-7"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed border-border rounded-lg">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Belum ada gambar. Upload gambar hero banner.</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Statistik</label>
            <Button type="button" variant="outline" size="sm" onClick={addStat} className="gap-1">
              <Plus className="h-3 w-3" /> Tambah
            </Button>
          </div>
          {form.stats.map((stat, i) => (
            <div key={i} className="p-3 rounded-lg border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stat {i + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeStat(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Icon</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={stat.icon}
                    onChange={(e) => updateStat(i, 'icon', e.target.value)}
                  >
                    {ICON_OPTIONS.map((ico) => <option key={ico} value={ico}>{ico}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Nilai</label>
                  <Input value={stat.value} onChange={(e) => updateStat(i, 'value', e.target.value)} placeholder="500+" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Label</label>
                  <Input value={stat.label} onChange={(e) => updateStat(i, 'label', e.target.value)} placeholder="Riders" />
                </div>
              </div>
            </div>
          ))}
          {!form.stats.length && <p className="text-sm text-muted-foreground text-center py-2">Belum ada statistik.</p>}
        </div>

        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-2">
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Hero Banner
        </Button>
      </CardContent>
    </Card>
  );
}
