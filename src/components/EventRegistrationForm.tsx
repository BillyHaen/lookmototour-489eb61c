import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/events';
import { Loader2, CheckCircle2, Heart } from 'lucide-react';
import type { DbEvent } from '@/hooks/useEvents';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RentalGearRecommendations, { SelectedRental } from '@/components/RentalGearRecommendations';
import CreditRedeemInput from '@/components/CreditRedeemInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MOTORCYCLES, MOTOR_BRANDS, getModelCategory } from '@/data/motorcycles';

const schema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(100),
  email: z.string().trim().email('Email tidak valid').max(255),
  phone: z.string().trim().min(10, 'Nomor HP minimal 10 digit').max(15).regex(/^[0-9+\-\s]+$/, 'Format nomor tidak valid'),
  motorBrand: z.string().trim().min(1, 'Pilih merk motor'),
  motorModel: z.string().trim().min(1, 'Pilih tipe motor'),
  plateNumber: z.string().trim().min(3, 'Masukkan plat nomor').max(15),
  emergencyContact: z.string().trim().min(10, 'Masukkan kontak darurat').max(100),
  registrationType: z.enum(['sharing', 'single', 'couple']),
  towingPergi: z.boolean().optional(),
  towingPulang: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export default function EventRegistrationForm({ event }: { event: DbEvent }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRentals, setSelectedRentals] = useState<Record<string, SelectedRental>>({});
  const [creditRedeem, setCreditRedeem] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isTentative = !!(event as any).tentative_month;
  const isFull = event.current_participants >= event.max_participants || (event as any).force_full;

  const { data: existingReg } = useQuery({
    queryKey: ['my-registration', event.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: existingInterest } = useQuery({
    queryKey: ['my-interest', event.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('event_interests')
        .select('*')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && isTentative,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['my-profile-interest', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ data: prof }, { data: priv }] = await Promise.all([
        supabase.from('profiles').select('name').eq('user_id', user.id).maybeSingle(),
        (supabase.from('profile_private') as any).select('phone').eq('user_id', user.id).maybeSingle(),
      ]);
      return { name: (prof as any)?.name || '', phone: (priv as any)?.phone || '' };
    },
    enabled: !!user && isTentative,
  });

  const interestMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Login diperlukan');
      const { error } = await supabase.from('event_interests').insert({
        event_id: event.id, user_id: user.id,
        name: userProfile?.name || '', phone: userProfile?.phone || '',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-interest', event.id, user?.id] });
      toast({ title: 'Minat tercatat! 🎉', description: 'Kami akan menghubungi kamu saat tanggal sudah fix.' });
    },
    onError: (e: Error) => {
      if (e.message.includes('duplicate') || e.message.includes('23505')) {
        toast({ title: 'Sudah tercatat', description: 'Kamu sudah menyatakan minat untuk trip ini.' });
      } else {
        toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
      }
    },
  });

  const handleInterest = () => {
    if (!user) {
      toast({ title: 'Login diperlukan', description: 'Silakan login terlebih dahulu.', variant: 'destructive' });
      navigate('/login');
      return;
    }
    interestMutation.mutate();
  };

  const paymentLabel = (status: string) => {
    if (status === 'lunas') return 'Lunas';
    if (status === 'batal') return 'Batal';
    if (status?.startsWith('cicilan_')) return `Cicilan ${status.split('_')[1]}`;
    return 'Menunggu Pembayaran';
  };

  const paymentVariant = (status: string) => {
    if (status === 'lunas') return 'default' as const;
    if (status === 'batal') return 'destructive' as const;
    if (status?.startsWith('cicilan_')) return 'secondary' as const;
    return 'outline' as const;
  };

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', motorBrand: '', motorModel: '', plateNumber: '', emergencyContact: '', registrationType: 'single', towingPergi: false, towingPulang: false, notes: '' },
  });

  const selectedType = form.watch('registrationType');
  const towingPergi = form.watch('towingPergi');
  const towingPulang = form.watch('towingPulang');
  const motorBrand = form.watch('motorBrand');
  const motorModel = form.watch('motorModel');

  const motorCategory = useMemo(
    () => (motorBrand && motorModel ? getModelCategory(motorBrand, motorModel) : ''),
    [motorBrand, motorModel]
  );
  const motorBrandLower = useMemo(() => (motorBrand || '').toLowerCase(), [motorBrand]);

  const towingEnabled = (event as any).towing_enabled || false;
  const towingPergiPrice = (event as any).towing_pergi_price || 0;
  const towingPulangPrice = (event as any).towing_pulang_price || 0;
  const priceMap: Record<string, number> = {
    sharing: (event as any).price_sharing || 0,
    single: (event as any).price_single || event.price || 0,
    couple: (event as any).price_couple || 0,
  };
  const basePrice = priceMap[selectedType] || 0;
  const towingTotal = (towingPergi ? towingPergiPrice : 0) + (towingPulang ? towingPulangPrice : 0);
  const rentalsTotal = Object.values(selectedRentals).reduce((s, r) => s + r.subtotal, 0);
  const rentalsDeposit = Object.values(selectedRentals).reduce((s, r) => s + r.deposit, 0);
  const selectedPrice = basePrice + towingTotal + rentalsTotal + rentalsDeposit;

  const handleOpen = (v: boolean) => {
    if (v && !user) {
      toast({ title: 'Login diperlukan', description: 'Silakan login terlebih dahulu untuk mendaftar event.', variant: 'destructive' });
      navigate('/login');
      return;
    }
    setOpen(v);
    if (!v) { setSubmitted(false); form.reset(); setSelectedRentals({}); }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);

    const rentalsArr = Object.values(selectedRentals).map(r => ({
      product_id: r.product_id,
      qty: r.qty,
      daily_price: r.daily_price,
      total_days: r.total_days,
      subtotal: r.subtotal,
      deposit: r.deposit,
    }));

    const { data: regId, error } = await (supabase.rpc as any)('create_registration_with_rentals', {
      _event_id: event.id,
      _credit_redeem: creditRedeem,
      _payload: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        motor_type: `${data.motorBrand} ${data.motorModel}`.trim(),
        plate_number: data.plateNumber,
        emergency_contact: data.emergencyContact,
        registration_type: data.registrationType,
        towing_pergi: data.towingPergi || false,
        towing_pulang: data.towingPulang || false,
        notes: data.notes || '',
      },
      _rentals: rentalsArr,
    });

    if (error) {
      setLoading(false);
      if ((error as any).code === '23505' || error.message?.includes('duplicate')) {
        toast({ title: 'Sudah terdaftar', description: 'Kamu sudah terdaftar untuk event ini.', variant: 'destructive' });
      } else {
        toast({ title: 'Gagal mendaftar', description: error.message, variant: 'destructive' });
      }
      return;
    }

    // Send confirmation emails (non-blocking — don't fail registration if email fails)
    try {
      const eventDateStr = new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const tierLabel = data.registrationType === 'sharing' ? 'Sharing' : data.registrationType === 'couple' ? 'Couple' : 'Single';
      const eventUrl = `${window.location.origin}/events/${(event as any).slug || event.id}`;

      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'event-registration-confirmation',
          recipientEmail: data.email,
          idempotencyKey: `reg-confirm-${regId}`,
          templateData: {
            name: data.name,
            eventTitle: event.title,
            eventDate: eventDateStr,
            eventLocation: event.location,
            totalAmount: formatPrice(selectedPrice),
            registrationType: tierLabel,
            eventUrl,
          },
        },
      });

      // Per-rental confirmation
      const rentalEntries = Object.values(selectedRentals);
      for (let i = 0; i < rentalEntries.length; i++) {
        const r = rentalEntries[i];
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'gear-rental-confirmation',
            recipientEmail: data.email,
            idempotencyKey: `rental-confirm-${regId}-${i}`,
            templateData: {
              name: data.name,
              productName: r.name || 'Gear',
              qty: r.qty,
              startDate: eventDateStr,
              endDate: event.end_date ? new Date(event.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : eventDateStr,
              totalDays: r.total_days,
              totalPrice: formatPrice(r.subtotal),
              deposit: formatPrice(r.deposit),
            },
          },
        });
      }
    } catch (emailErr) {
      console.warn('Email confirmation failed (non-fatal):', emailErr);
    }

    setLoading(false);
    setSubmitted(true);
    queryClient.invalidateQueries({ queryKey: ['event', event.id] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['my-registration', event.id, user?.id] });
    queryClient.invalidateQueries({ queryKey: ['my-rentals'] });
    toast({ title: 'Pendaftaran berhasil! 🎉', description: `Detail dikirim ke email ${data.email}` });
  };

  if (isTentative) {
    if (existingInterest) {
      return (
        <Button size="lg" className="w-full text-base font-semibold" disabled>
          ✅ Anda Sudah Menyatakan Minat
        </Button>
      );
    }
    return (
      <Button size="lg" className="w-full text-base font-semibold gap-2" onClick={handleInterest} disabled={interestMutation.isPending}>
        {interestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-5 w-5" />}
        🙋 Saya Minat Trip Ini!
      </Button>
    );
  }

  if (existingReg) {
    return (
      <div className="w-full text-center space-y-2">
        <Button size="lg" className="w-full text-base font-semibold" disabled>
          ✅ Anda Sudah Mendaftar
        </Button>
        <Badge variant={paymentVariant((existingReg as any).payment_status || 'pending')} className="text-sm">
          {paymentLabel((existingReg as any).payment_status || 'pending')}
          {(existingReg as any).payment_status?.startsWith('cicilan_') && (existingReg as any).installment_amount > 0 && (
            <span className="ml-1">— {formatPrice((existingReg as any).installment_amount)}</span>
          )}
        </Badge>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full text-base font-semibold" disabled={isFull || event.status === 'completed'}>
          {(event as any).force_full ? 'Kuota Penuh' : isFull ? 'Event Penuh' : event.status === 'completed' ? 'Event Selesai' : 'Daftar Sekarang'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {submitted ? 'Pendaftaran Berhasil!' : `Daftar: ${event.title}`}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center py-8 gap-4 animate-fade-in">
            <CheckCircle2 className="h-16 w-16 text-accent" />
            <p className="text-center text-muted-foreground">
              Terima kasih sudah mendaftar! Detail event akan dikirim ke email kamu.
            </p>
            <Button onClick={() => setOpen(false)}>Tutup</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap *</FormLabel>
                  <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl><Input type="email" placeholder="john@email.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. HP *</FormLabel>
                    <FormControl><Input placeholder="08123456789" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="motorBrand" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Merk Motor *</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={(v) => { field.onChange(v); form.setValue('motorModel', ''); }}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pilih merk" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOTOR_BRANDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="motorModel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Motor *</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange} disabled={!motorBrand}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={motorBrand ? 'Pilih tipe' : 'Pilih merk dulu'} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(MOTORCYCLES[motorBrand] || []).map((m) => (
                          <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="plateNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plat Nomor *</FormLabel>
                  <FormControl><Input placeholder="B 1234 XYZ" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kontak Darurat *</FormLabel>
                  <FormControl><Input placeholder="Nama - 08123456789" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="registrationType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Pendaftaran *</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'sharing', label: 'Sharing', price: priceMap.sharing },
                      { value: 'single', label: 'Single', price: priceMap.single },
                      { value: 'couple', label: 'Couple', price: priceMap.couple },
                    ].filter(t => t.price > 0).map(t => (
                      <button key={t.value} type="button" onClick={() => field.onChange(t.value)}
                        className={`p-3 rounded-lg border text-center transition-all ${field.value === t.value ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}>
                        <p className="text-xs font-medium">{t.label}</p>
                        <p className="text-sm font-bold text-primary">{formatPrice(t.price)}</p>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Rental gear recommendations */}
              <RentalGearRecommendations
                eventId={event.id}
                motorType={motorCategory}
                motorBrand={motorBrandLower}
                selected={selectedRentals}
                onChange={setSelectedRentals}
              />

              {towingEnabled && (
                <div className="space-y-2 p-3 rounded-lg border border-border">
                  <p className="text-sm font-medium">Opsi Towing Motor</p>
                  {towingPergiPrice > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={towingPergi} onChange={(e) => form.setValue('towingPergi', e.target.checked)} className="h-4 w-4 rounded border-input" />
                      <span className="text-sm">Towing Pergi</span>
                      <span className="text-sm font-bold text-primary ml-auto">{formatPrice(towingPergiPrice)}</span>
                    </label>
                  )}
                  {towingPulangPrice > 0 && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={towingPulang} onChange={(e) => form.setValue('towingPulang', e.target.checked)} className="h-4 w-4 rounded border-input" />
                      <span className="text-sm">Towing Pulang</span>
                      <span className="text-sm font-bold text-primary ml-auto">{formatPrice(towingPulangPrice)}</span>
                    </label>
                  )}
                </div>
              )}
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl><Textarea placeholder="Alergi, kebutuhan khusus, dll..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <CreditRedeemInput totalPrice={selectedPrice} value={creditRedeem} onChange={setCreditRedeem} />

              {/* Price breakdown */}
              <div className="p-3 rounded-lg bg-muted/50 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Trip ({selectedType})</span><span>{formatPrice(basePrice)}</span></div>
                {towingTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Towing</span><span>{formatPrice(towingTotal)}</span></div>}
                {rentalsTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Sewa Gear ({Object.keys(selectedRentals).length})</span><span>{formatPrice(rentalsTotal)}</span></div>}
                {rentalsDeposit > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Deposit gear (refundable)</span><span>{formatPrice(rentalsDeposit)}</span></div>}
                {creditRedeem > 0 && <div className="flex justify-between text-xs text-emerald-600"><span>Pakai wallet</span><span>− {formatPrice(creditRedeem)}</span></div>}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-border"><span>Total</span><span className="text-primary">{formatPrice(Math.max(0, selectedPrice - creditRedeem))}</span></div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? 'Mendaftar...' : `Kirim Pendaftaran - ${formatPrice(Math.max(0, selectedPrice - creditRedeem))}`}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
