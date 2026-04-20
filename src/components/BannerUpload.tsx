import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface BannerUploadProps {
  userId: string;
  currentUrl?: string | null;
  onUploaded?: (url: string) => void;
}

export default function BannerUpload({ userId, currentUrl, onUploaded }: BannerUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'File harus berupa gambar', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Ukuran file maksimal 5MB', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${userId}/banner.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const bannerUrl = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.from('profiles').update({ banner_url: bannerUrl }).eq('user_id', userId);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['rider'] });
      onUploaded?.(bannerUrl);
      toast({ title: 'Banner berhasil diperbarui! ✅' });
    } catch (err: any) {
      toast({ title: 'Gagal upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const { error } = await supabase.from('profiles').update({ banner_url: null }).eq('user_id', userId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['rider'] });
      onUploaded?.('');
      toast({ title: 'Banner dihapus' });
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className="relative aspect-[16/6] w-full rounded-lg border border-border overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 cursor-pointer group"
        onClick={() => fileRef.current?.click()}
      >
        {currentUrl && <img src={currentUrl} alt="Banner profil" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
            <div className="text-center">
              <ImagePlus className="h-6 w-6 text-primary mx-auto" />
              <p className="text-xs font-medium mt-1">{currentUrl ? 'Ganti banner' : 'Upload banner'}</p>
            </div>
          )}
        </div>
      </div>
      {currentUrl && (
        <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={uploading} className="text-destructive">
          <X className="h-3 w-3 mr-1" />Hapus banner
        </Button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <p className="text-xs text-muted-foreground">Rasio 16:6 disarankan • Max 5MB</p>
    </div>
  );
}
