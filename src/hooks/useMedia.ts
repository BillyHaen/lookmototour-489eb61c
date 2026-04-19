import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type MediaType = 'image' | 'video' | 'document';

export interface MediaItem {
  id: string;
  file_url: string;
  file_name: string;
  file_type: MediaType;
  mime_type: string | null;
  size_bytes: number | null;
  bucket: string;
  uploaded_by: string;
  created_at: string;
}

export function detectFileType(mime: string): MediaType {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'document';
}

export function useMediaLibrary(filterType?: MediaType | 'all', search?: string) {
  return useQuery({
    queryKey: ['media-library', filterType, search],
    queryFn: async () => {
      let q = supabase.from('media_library').select('*').order('created_at', { ascending: false });
      if (filterType && filterType !== 'all') q = q.eq('file_type', filterType);
      if (search) q = q.ilike('file_name', `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as MediaItem[];
    },
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      const type = detectFileType(file.type);
      // Images go to blog-images, others to media-library
      const bucket = type === 'image' ? 'blog-images' : 'media-library';
      const ext = file.name.split('.').pop() || 'bin';
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `library/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const { data, error } = await supabase
        .from('media_library')
        .insert({
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: type,
          mime_type: file.type,
          size_bytes: file.size,
          bucket,
          uploaded_by: userId,
        })
        .select()
        .single();
      if (error) throw error;
      return data as MediaItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media-library'] }),
    onError: (err: any) => toast({ title: 'Gagal upload', description: err.message, variant: 'destructive' }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: MediaItem) => {
      // try to extract storage path from URL
      const marker = `/object/public/${item.bucket}/`;
      const idx = item.file_url.indexOf(marker);
      if (idx >= 0) {
        const path = decodeURIComponent(item.file_url.substring(idx + marker.length));
        await supabase.storage.from(item.bucket).remove([path]);
      }
      const { error } = await supabase.from('media_library').delete().eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media-library'] });
      toast({ title: 'File dihapus ✅' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });
}
