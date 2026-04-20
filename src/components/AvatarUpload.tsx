import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Camera } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import AvatarCropDialog from './AvatarCropDialog';

interface AvatarUploadProps {
  userId: string;
  currentUrl?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'h-10 w-10',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
};

export default function AvatarUpload({ userId, currentUrl, name, size = 'lg' }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleCropped = async (blob: Blob) => {
    setUploading(true);
    try {
      const filePath = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', userId);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['member-profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['approved-testimonials'] });
      queryClient.invalidateQueries({ queryKey: ['rider'] });
      toast({ title: 'Foto profil berhasil diperbarui! ✅' });
      setCropSrc(null);
    } catch (err: any) {
      toast({ title: 'Gagal upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const initial = (name || 'U')[0].toUpperCase();

  return (
    <div className="relative group inline-block">
      <Avatar className={SIZE_MAP[size]}>
        <AvatarImage src={currentUrl || undefined} alt={name || 'Avatar'} className="object-cover" />
        <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
          {initial}
        </AvatarFallback>
      </Avatar>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Camera className="h-5 w-5 text-primary" />}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {cropSrc && (
        <AvatarCropDialog
          open={!!cropSrc}
          onOpenChange={(o) => !o && setCropSrc(null)}
          imageSrc={cropSrc}
          onCropped={handleCropped}
          saving={uploading}
        />
      )}
    </div>
  );
}
