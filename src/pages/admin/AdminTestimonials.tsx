import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Check, X, Star } from 'lucide-react';

export default function AdminTestimonials() {
  const queryClient = useQueryClient();

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('testimonials') as any)
        .select('*, profiles!testimonials_user_id_fkey(name, avatar_url), events!testimonials_event_id_fkey(title)')
        .order('created_at', { ascending: false });
      if (error) {
        // Fallback without joins
        const { data: fallback, error: err2 } = await (supabase.from('testimonials') as any).select('*').order('created_at', { ascending: false });
        if (err2) throw err2;
        return fallback as any[];
      }
      return data as any[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase.from('testimonials') as any).update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast({ title: 'Status diperbarui ✅' });
    },
  });

  const statusColor = (s: string) => {
    if (s === 'approved') return 'default';
    if (s === 'rejected') return 'destructive';
    return 'secondary';
  };

  const statusLabel = (s: string) => {
    if (s === 'approved') return 'Disetujui';
    if (s === 'rejected') return 'Ditolak';
    return 'Menunggu';
  };

  return (
    <AdminLayout>
      <h1 className="font-heading font-bold text-2xl mb-6">Moderasi Testimoni</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {testimonials?.map((t: any) => (
            <div key={t.id} className="p-4 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.profiles?.name || 'User'}</p>
                  <p className="text-sm text-muted-foreground">Event: {t.events?.title || t.event_id}</p>
                </div>
                <Badge variant={statusColor(t.status) as any}>{statusLabel(t.status)}</Badge>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                ))}
              </div>
              <p className="text-sm">{t.content}</p>
              <div className="flex gap-2">
                {t.status !== 'approved' && (
                  <Button variant="default" size="sm" className="gap-1" onClick={() => updateStatus.mutate({ id: t.id, status: 'approved' })}>
                    <Check className="h-3 w-3" /> Setujui
                  </Button>
                )}
                {t.status !== 'rejected' && (
                  <Button variant="destructive" size="sm" className="gap-1" onClick={() => updateStatus.mutate({ id: t.id, status: 'rejected' })}>
                    <X className="h-3 w-3" /> Tolak
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!testimonials?.length && <p className="text-muted-foreground text-center py-8">Belum ada testimoni.</p>}
        </div>
      )}
    </AdminLayout>
  );
}
