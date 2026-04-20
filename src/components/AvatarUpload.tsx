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
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'overlay' | 'badge';
  ringClassName?: string;
}

const SIZE_MAP = {
  sm: 'h-10 w-10',
  md: 'h-20 w-20',
  lg: 'h-28 w-28',
  xl: 'h-28 w-28 sm:h-36 sm:w-36',
};

export default function AvatarUpload({ userId, currentUrl, name, size = 'lg', variant = 'overlay', ringClassName = '' }: AvatarUploadProps) {
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
    <div className="relative inline-block">
      <Avatar className={`${SIZE_MAP[size]} ${ringClassName}`}>
        <AvatarImage src={currentUrl || undefined} alt={name || 'Avatar'} className="object-cover" />
        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
          {initial}
        </AvatarFallback>
      </Avatar>

      {variant === 'overlay' ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 opacity-0 hover:opacity-100 transition-opacity cursor-pointer group"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Camera className="h-5 w-5 text-primary" />}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Ganti foto profil"
          className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-background border border-border shadow-md hover:bg-muted transition-colors"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Camera className="h-4 w-4 text-foreground" />}
        </button>
      )}

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
