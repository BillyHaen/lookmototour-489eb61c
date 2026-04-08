import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, MessageCircle, Search, Phone, Mail, Bike, CreditCard } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { formatDate, formatPrice } from '@/data/events';
import { toast } from '@/hooks/use-toast';

interface Props {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminEventParticipants({ eventId, eventTitle, open, onOpenChange }: Props) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['admin-event-registrations', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch profiles for avatars
      const userIds = [...new Set((data || []).map(r => r.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return (data || []).map(r => ({
        ...r,
        profile: profileMap.get(r.user_id) || null,
      }));
    },
    enabled: open,
  });

  const filtered = (registrations || []).filter(r =>
    !search ||
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.phone.includes(search) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatWhatsApp = (phone: string) => {
    let num = phone.replace(/[^0-9]/g, '');
    if (num.startsWith('0')) num = '62' + num.slice(1);
    if (!num.startsWith('62')) num = '62' + num;
    return num;
  };

  const openWhatsApp = (phone: string, name: string) => {
    const waNum = formatWhatsApp(phone);
    const msg = encodeURIComponent(`Halo ${name}, ini dari LookMotoTour mengenai event "${eventTitle}".`);
    window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank');
  };

  const updatePayment = async (regId: string, status: string, amount: number) => {
    const { error } = await supabase
      .from('event_registrations')
      .update({ payment_status: status, installment_amount: amount } as any)
      .eq('id', regId);
    if (error) {
      toast({ title: 'Gagal update', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status pembayaran diperbarui' });
      queryClient.invalidateQueries({ queryKey: ['admin-event-registrations', eventId] });
    }
  };

  const paymentLabel = (status: string) => {
    if (status === 'lunas') return 'Lunas';
    if (status?.startsWith('cicilan_')) return `Cicilan ${status.split('_')[1]}`;
    return 'Belum Bayar';
  };

  const paymentColor = (status: string) => {
    if (status === 'lunas') return 'default';
    if (status?.startsWith('cicilan_')) return 'secondary';
    return 'outline' as const;
  };

  const regTypeLabel = (t: string) => {
    if (t === 'sharing') return 'Sharing';
    if (t === 'couple') return 'Couple';
    return 'Single';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Peserta — {eventTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, telepon, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !filtered.length ? (
          <p className="text-muted-foreground text-center py-8 text-sm">
            {search ? 'Tidak ada peserta yang cocok.' : 'Belum ada peserta terdaftar.'}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{filtered.length} peserta</p>
            {filtered.map((r) => (
              <div key={r.id} className="p-4 rounded-lg border border-border bg-card space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={r.profile?.avatar_url}
                      name={r.name}
                      className="h-10 w-10"
                    />
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Terdaftar {formatDate(r.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === 'confirmed' ? 'default' : 'secondary'}>
                      {r.status === 'confirmed' ? 'Terdaftar' : r.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                      onClick={() => openWhatsApp(r.phone, r.name)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{r.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{r.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Bike className="h-3.5 w-3.5" />
                    <span>{r.motor_type || '-'} {r.plate_number ? `(${r.plate_number})` : ''}</span>
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-xs">Darurat: {r.emergency_contact || '-'}</span>
                  </div>
                </div>

                {r.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                    Catatan: {r.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
