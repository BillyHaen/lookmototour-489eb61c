import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Props {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminEventInterests({ eventId, eventTitle, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const { data: interests, isLoading } = useQuery({
    queryKey: ['admin-event-interests', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_interests')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('event_interests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event-interests', eventId] });
      toast({ title: 'Peminat dihapus ✅' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🙋 Peminat: {eventTitle}
            <Badge variant="secondary">{interests?.length || 0} orang</Badge>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !interests?.length ? (
          <p className="text-muted-foreground text-center py-8">Belum ada peminat.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interests.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.name || '-'}</TableCell>
                  <TableCell>{i.phone || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(i.created_at).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(i.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
