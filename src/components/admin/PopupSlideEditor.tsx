import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import RichTextEditor from '@/components/RichTextEditor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Upload } from 'lucide-react';

export interface SlideDraft {
  id?: string;
  order_index: number;
  image_url: string | null;
  content_html: string;
  cta_label: string | null;
  cta_url: string | null;
}

interface Props {
  value: SlideDraft[];
  onChange: (next: SlideDraft[]) => void;
}

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export default function PopupSlideEditor({ value, onChange }: Props) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateSlide = (i: number, patch: Partial<SlideDraft>) => {
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const addSlide = () => {
    onChange([
      ...value,
      {
        order_index: value.length,
        image_url: null,
        content_html: '',
        cta_label: '',
        cta_url: '',
      },
    ]);
  };

  const removeSlide = (i: number) => {
    const next = value.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order_index: idx }));
    onChange(next);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const arr = [...value];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr.map((s, idx) => ({ ...s, order_index: idx })));
  };

  const handleUpload = async (i: number, file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast({ title: 'Format tidak didukung', description: 'Gunakan JPG, PNG, atau WEBP.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: 'File terlalu besar', description: 'Maksimal 2MB.', variant: 'destructive' });
      return;
    }
    setUploadingIdx(i);
    try {
      const ext = file.name.split('.').pop();
      const path = `slides/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('popup-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('popup-images').getPublicUrl(path);
      updateSlide(i, { image_url: data.publicUrl });
      toast({ title: 'Gambar diupload ✅' });
    } catch (err: any) {
      toast({ title: 'Upload gagal', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingIdx(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Slide ({value.length})</Label>
        <Button type="button" size="sm" variant="outline" onClick={addSlide} className="gap-1">
          <Plus className="h-4 w-4" /> Tambah Slide
        </Button>
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
          Belum ada slide. Klik "Tambah Slide" untuk memulai.
        </p>
      )}

      {value.map((slide, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Slide #{i + 1}</span>
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => removeSlide(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">Gambar (max 2MB, JPG/PNG/WEBP)</Label>
              <div className="flex items-center gap-3 mt-1">
                {slide.image_url ? (
                  <img src={slide.image_url} alt="" className="h-20 w-20 object-cover rounded-md border" />
                ) : (
                  <div className="h-20 w-20 rounded-md border border-dashed flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileRefs.current[i]?.click()}
                    disabled={uploadingIdx === i}
                    className="gap-1"
                  >
                    {uploadingIdx === i ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload
                  </Button>
                  {slide.image_url && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => updateSlide(i, { image_url: null })}>
                      Hapus
                    </Button>
                  )}
                  <input
                    ref={(el) => (fileRefs.current[i] = el)}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(i, f);
                      if (e.target) e.target.value = '';
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Konten (rich text)</Label>
              <RichTextEditor
                value={slide.content_html}
                onChange={(v) => updateSlide(i, { content_html: v })}
                placeholder="Tulis konten slide..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Label CTA</Label>
                <Input
                  value={slide.cta_label || ''}
                  onChange={(e) => updateSlide(i, { cta_label: e.target.value })}
                  placeholder="mis. Daftar Sekarang"
                />
              </div>
              <div>
                <Label className="text-xs">URL CTA</Label>
                <Input
                  value={slide.cta_url || ''}
                  onChange={(e) => updateSlide(i, { cta_url: e.target.value })}
                  placeholder="/events atau https://..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
