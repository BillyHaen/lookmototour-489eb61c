import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Plus } from 'lucide-react';

interface ImageItem {
  image_url: string;
  caption: string;
}

interface MultiImageUploadProps {
  value: ImageItem[];
  onChange: (items: ImageItem[]) => void;
  bucket: string;
}

export default function MultiImageUpload({ value, onChange, bucket }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const newItems: ImageItem[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop();
        const fileName = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        newItems.push({ image_url: urlData.publicUrl, caption: '' });
      }
      onChange([...value, ...newItems]);
      toast({ title: `${newItems.length} gambar berhasil diupload ✅` });
    } catch (err: any) {
      toast({ title: 'Gagal upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], caption };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Galeri Foto</label>
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {value.map((item, i) => (
            <div key={i} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-border">
                <img src={item.image_url} alt={item.caption || `Photo ${i + 1}`} className="w-full h-full object-cover" />
              </div>
              <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(i)}>
                <X className="h-3 w-3" />
              </Button>
              <Input placeholder="Caption..." value={item.caption} onChange={(e) => updateCaption(i, e.target.value)} className="mt-1 text-xs h-7" />
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" className="gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {uploading ? 'Mengupload...' : 'Tambah Foto'}
      </Button>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
    </div>
  );
}
