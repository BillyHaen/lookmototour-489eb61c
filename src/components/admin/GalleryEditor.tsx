import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface GalleryImage {
  url: string;
  alt: string;
}

interface Props {
  value: GalleryImage[];
  onChange: (v: GalleryImage[]) => void;
  bucket?: string;
}

export default function GalleryEditor({ value, onChange, bucket = 'event-images' }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const items = value || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const newOnes: GalleryImage[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop();
        const fileName = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        newOnes.push({ url: data.publicUrl, alt: '' });
      }
      onChange([...items, ...newOnes]);
      toast({ title: `${newOnes.length} gambar diupload ✅` });
    } catch (err: any) {
      toast({ title: 'Gagal upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const updateAlt = (i: number, alt: string) => onChange(items.map((it, idx) => (idx === i ? { ...it, alt } : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Galeri Foto (dengan ALT untuk SEO)</label>
      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((it, i) => (
            <div key={i} className="space-y-1">
              <div className="relative group aspect-square rounded-lg overflow-hidden border border-border">
                <img src={it.url} alt={it.alt || `Galeri ${i + 1}`} className="w-full h-full object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => remove(i)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input className="h-7 text-xs" placeholder="Alt text (SEO)" value={it.alt} onChange={(e) => updateAlt(i, e.target.value)} />
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="gap-2">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Tambah Foto
      </Button>
      <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
