import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, MessageCircle, Search, Phone, Mail, Bike, CreditCard, Trash2, Truck, Plus, Wallet, Package, AlertCircle } from 'lucide-react';
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
  const [addPaymentFor, setAddPaymentFor] = useState<string | null>(null);
  const [nextInstallment, setNextInstallment] = useState<string>('');
  const [addAmount, setAddAmount] = useState<string>('');
  const queryClient = useQueryClient();

  // Load event for pricing
  const { data: event } = useQuery({
    queryKey: ['admin-event-pricing', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('price, price_single, price_sharing, price_couple, towing_pergi_price, towing_pulang_price')
        .eq('id', eventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['admin-event-registrations', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map(r => r.user_id))];
      const regIds = (data || []).map(r => r.id);
      if (userIds.length === 0) return [];

      const [{ data: profiles }, { data: rentals }] = await Promise.all([
        supabase.from('profiles').select('user_id, name, avatar_url').in('user_id', userIds),
        (supabase.from('gear_rentals') as any)
          .select('id, registration_id, qty, total_price, deposit_amount, status, total_days, products(name, image_url)')
          .in('registration_id', regIds),
      ]);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const rentalsByReg = new Map<string, any[]>();
      (rentals || []).forEach((r: any) => {
        if (!r.registration_id) return;
        const arr = rentalsByReg.get(r.registration_id) || [];
        arr.push(r);
        rentalsByReg.set(r.registration_id, arr);
      });

      return (data || []).map(r => {
        const regRentals = rentalsByReg.get(r.id) || [];
        const rentals_total = regRentals.reduce((s, x) => s + (x.total_price || 0) + (x.deposit_amount || 0), 0);
        return {
          ...r,
          profile: profileMap.get(r.user_id) || null,
          rentals: regRentals,
          rentals_total,
        };
      });
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

  const computeTotal = (r: any): number => {
    if (!event) return 0;
    const tierPrice =
      r.registration_type === 'sharing' ? (event.price_sharing || 0) :
      r.registration_type === 'couple' ? (event.price_couple || 0) :
      (event.price_single || event.price || 0);
    const towing = (r.towing_pergi ? (event.towing_pergi_price || 0) : 0) + (r.towing_pulang ? (event.towing_pulang_price || 0) : 0);
    const gross = tierPrice + towing + (r.rentals_total || 0);
    const credit = Math.max(0, Number((r as any).credit_redeemed) || 0);
    return Math.max(0, gross - credit);
  };

  const updatePayment = async (regId: string, status: string, amount: number) => {
    const { error } = await supabase
      .from('event_registrations')
      .update({ payment_status: status, installment_amount: amount })
      .eq('id', regId);
    if (error) {
      toast({ title: 'Gagal update', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status pembayaran diperbarui' });
      queryClient.invalidateQueries({ queryKey: ['admin-event-registrations', eventId] });
    }
  };

  const submitAddPayment = async (r: any) => {
    if (!nextInstallment) {
      toast({ title: 'Pilih cicilan dulu', variant: 'destructive' });
      return;
    }
    const addAmt = parseInt(addAmount) || 0;
    if (addAmt <= 0) {
      toast({ title: 'Masukkan nominal pembayaran', variant: 'destructive' });
      return;
    }
    const newTotal = (r.installment_amount || 0) + addAmt;
    await updatePayment(r.id, nextInstallment, newTotal);
    setAddPaymentFor(null);
    setNextInstallment('');
    setAddAmount('');
  };

  const deleteRegistration = async (regId: string, name: string) => {
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('id', regId);
    if (error) {
      toast({ title: 'Gagal menghapus', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Peserta "${name}" berhasil dihapus` });
      queryClient.invalidateQueries({ queryKey: ['admin-event-registrations', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  };

  const canDelete = (status: string) => status === 'pending' || status === 'batal';

  const paymentLabel = (status: string) => {
    if (status === 'lunas') return 'Lunas';
    if (status === 'batal') return 'Batal';
    if (status?.startsWith('cicilan_')) return `Cicilan ${status.split('_')[1]}`;
    return 'Belum Bayar';
  };

  const paymentColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    if (status === 'lunas') return 'default';
    if (status === 'batal') return 'destructive';
    if (status?.startsWith('cicilan_')) return 'secondary';
    return 'outline';
  };

  const regTypeLabel = (t: string) => {
    if (t === 'sharing') return 'Sharing';
    if (t === 'couple') return 'Couple';
    return 'Single';
  };

  const currentInstallmentNum = (status: string): number => {
    if (status?.startsWith('cicilan_')) return parseInt(status.split('_')[1]) || 0;
    return 0;
  };

  // Local formatter — shows "Rp 0" instead of "GRATIS" for zero amounts
  const formatPaid = (n: number): string => {
    if (n <= 0) return 'Rp 0';
    return formatPrice(n);
  };

  const rentalStatusLabel = (s: string) => ({
    pending: 'Belum Dikonfirmasi',
    confirmed: 'Dikonfirmasi',
    picked_up: 'Sudah Diambil',
    returned: 'Dikembalikan',
    cancelled: 'Dibatalkan',
  } as Record<string, string>)[s] || s;

  const rentalStatusClass = (s: string): string => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800';
      case 'picked_up': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-200 dark:border-green-800';
      case 'returned': return 'bg-muted text-muted-foreground border-border';
      case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  // Block close on outside-click / Escape — only X icon closes
  const handleOpenChange = (v: boolean) => {
    if (v) onOpenChange(true);
    // ignore close attempts here — only the X button (DialogContent's built-in close) will close
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
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
            {filtered.map((r) => {
              const total = computeTotal(r);
              const paid = r.installment_amount || 0;
              const remaining = Math.max(total - paid, 0);
              const currentNum = currentInstallmentNum(r.payment_status);
              const availableInstallments = [1, 2, 3, 4, 5, 6].filter(n => n > currentNum);
              const isAddingForThis = addPaymentFor === r.id;

              return (
                <div key={r.id} className="p-4 rounded-lg border border-border bg-card space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
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
                      <Badge variant={paymentColor(r.payment_status)}>
                        {paymentLabel(r.payment_status)}
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
                      {canDelete(r.payment_status) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Peserta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus <strong>{r.name}</strong> dari event ini? Tindakan ini tidak bisa dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteRegistration(r.id, r.name)}
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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

                  {/* Payment section */}
                  <div className="p-3 rounded-lg bg-muted/50 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium flex-wrap">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Pembayaran — <Badge variant="outline">{regTypeLabel(r.registration_type)}</Badge>
                    </div>

                    {/* Total summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div className="p-2 rounded-md bg-background border border-border">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Wallet className="h-3 w-3" /> Total Biaya
                        </p>
                        <p className="font-bold text-primary">{formatPrice(total)}</p>
                      </div>
                      <div className="p-2 rounded-md bg-background border border-border">
                        <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
                        <p className="font-bold text-green-600">{formatPaid(paid)}</p>
                      </div>
                      <div className="p-2 rounded-md bg-background border border-border">
                        <p className="text-xs text-muted-foreground">Sisa</p>
                        <p className={`font-bold ${remaining === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                          {formatPrice(remaining)}
                        </p>
                      </div>
                    </div>

                    {/* Status changer */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <Select
                        value={r.payment_status || 'pending'}
                        onValueChange={(val) => {
                          const amt = val === 'lunas' ? total : (val === 'batal' || val === 'pending') ? 0 : r.installment_amount || 0;
                          updatePayment(r.id, val, amt);
                        }}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Belum Bayar</SelectItem>
                          <SelectItem value="lunas">Lunas</SelectItem>
                          <SelectItem value="batal">Batal</SelectItem>
                          {[1,2,3,4,5,6].map(n => (
                            <SelectItem key={n} value={`cicilan_${n}`}>Cicilan {n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {r.payment_status !== 'lunas' && r.payment_status !== 'batal' && availableInstallments.length > 0 && !isAddingForThis && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5"
                          onClick={() => {
                            setAddPaymentFor(r.id);
                            setNextInstallment(`cicilan_${availableInstallments[0]}`);
                            setAddAmount('');
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Tambah Pembayaran
                        </Button>
                      )}
                    </div>

                    {/* Add payment inline form */}
                    {isAddingForThis && (
                      <div className="p-3 rounded-md border border-primary/30 bg-primary/5 space-y-2">
                        <p className="text-xs font-medium">Tambah Pembayaran Berikutnya</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Select value={nextInstallment} onValueChange={setNextInstallment}>
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                              <SelectValue placeholder="Pilih cicilan" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableInstallments.map(n => (
                                <SelectItem key={n} value={`cicilan_${n}`}>Cicilan {n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            placeholder="Nominal pembayaran"
                            className="w-[180px] h-8 text-xs"
                            value={addAmount}
                            onChange={(e) => setAddAmount(e.target.value)}
                          />
                          <Button size="sm" className="h-8" onClick={() => submitAddPayment(r)}>
                            Simpan
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8"
                            onClick={() => { setAddPaymentFor(null); setNextInstallment(''); setAddAmount(''); }}
                          >
                            Batal
                          </Button>
                        </div>
                        {addAmount && parseInt(addAmount) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Total terbayar setelah ini: <strong>{formatPrice(paid + (parseInt(addAmount) || 0))}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cost breakdown */}
                  {(() => {
                    const tierPrice =
                      r.registration_type === 'sharing' ? (event?.price_sharing || 0) :
                      r.registration_type === 'couple' ? (event?.price_couple || 0) :
                      (event?.price_single || event?.price || 0);
                    const towingPergiPrice = (r as any).towing_pergi ? (event?.towing_pergi_price || 0) : 0;
                    const towingPulangPrice = (r as any).towing_pulang ? (event?.towing_pulang_price || 0) : 0;
                    return (
                      <div className="p-3 rounded-lg border border-border bg-background/50 space-y-2">
                        <p className="text-xs font-medium flex items-center gap-1.5">
                          <Wallet className="h-3.5 w-3.5 text-primary" /> Rincian Biaya
                        </p>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Trip ({regTypeLabel(r.registration_type)})</span>
                            <span>{formatPrice(tierPrice)}</span>
                          </div>
                          {(r as any).towing_pergi && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> Towing Pergi</span>
                              <span>{formatPrice(towingPergiPrice)}</span>
                            </div>
                          )}
                          {(r as any).towing_pulang && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> Towing Pulang</span>
                              <span>{formatPrice(towingPulangPrice)}</span>
                            </div>
                          )}
                          {(r.rentals || []).length > 0 && (
                            <div className="pt-1.5 mt-1.5 border-t border-border space-y-1.5">
                              <p className="text-xs font-medium flex items-center gap-1.5">
                                <Package className="h-3 w-3" /> Sewa Gear ({r.rentals.length})
                              </p>
                              {r.rentals.map((gr: any) => (
                                <div key={gr.id} className="flex items-start justify-between gap-2 pl-4">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    {gr.products?.image_url && (
                                      <img src={gr.products.image_url} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium truncate">
                                        {gr.products?.name || 'Gear'} {gr.qty > 1 && <span className="text-muted-foreground">× {gr.qty}</span>}
                                      </p>
                                      <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border mt-0.5 ${rentalStatusClass(gr.status)}`}>
                                        {gr.status === 'pending' && <AlertCircle className="h-2.5 w-2.5" />}
                                        {rentalStatusLabel(gr.status)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <span className="text-xs font-medium block">{formatPrice(gr.total_price || 0)}</span>
                                    {gr.deposit_amount > 0 && (
                                      <span className="text-[10px] text-muted-foreground block">+ deposit {formatPrice(gr.deposit_amount)}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex justify-between pt-1.5 mt-1.5 border-t border-border font-bold">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(total)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {r.notes && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      Catatan: {r.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
