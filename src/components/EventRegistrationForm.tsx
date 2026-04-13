import { useState } from 'react';
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
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { DbEvent } from '@/hooks/useEvents';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(100),
  email: z.string().trim().email('Email tidak valid').max(255),
  phone: z.string().trim().min(10, 'Nomor HP minimal 10 digit').max(15).regex(/^[0-9+\-\s]+$/, 'Format nomor tidak valid'),
  motorType: z.string().trim().min(2, 'Masukkan tipe motor').max(100),
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFull = event.current_participants >= event.max_participants;

  // Check if user already registered
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
    defaultValues: { name: '', email: '', phone: '', motorType: '', plateNumber: '', emergencyContact: '', registrationType: 'single', towingPergi: false, towingPulang: false, notes: '' },
  });

  const selectedType = form.watch('registrationType');
  const towingPergi = form.watch('towingPergi');
  const towingPulang = form.watch('towingPulang');
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
  const selectedPrice = basePrice + towingTotal;

  const handleOpen = (v: boolean) => {
    if (v && !user) {
      toast({ title: 'Login diperlukan', description: 'Silakan login terlebih dahulu untuk mendaftar event.', variant: 'destructive' });
      navigate('/login');
      return;
    }
    setOpen(v);
    if (!v) { setSubmitted(false); form.reset(); }
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from('event_registrations').insert({
      event_id: event.id,
      user_id: user.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      motor_type: data.motorType,
      plate_number: data.plateNumber,
      emergency_contact: data.emergencyContact,
      registration_type: data.registrationType,
      towing_pergi: data.towingPergi || false,
      towing_pulang: data.towingPulang || false,
      notes: data.notes || '',
    });

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Sudah terdaftar', description: 'Email ini sudah terdaftar untuk event ini.', variant: 'destructive' });
      } else {
        toast({ title: 'Gagal mendaftar', description: error.message, variant: 'destructive' });
      }
      return;
    }

    setSubmitted(true);
    queryClient.invalidateQueries({ queryKey: ['event', event.id] });
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['my-registration', event.id, user?.id] });
    toast({ title: 'Pendaftaran berhasil! 🎉', description: `Kamu sudah terdaftar untuk ${event.title}` });
  };

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
          {isFull ? 'Event Penuh' : event.status === 'completed' ? 'Event Selesai' : 'Daftar Sekarang'}
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
                <FormField control={form.control} name="motorType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe Motor *</FormLabel>
                    <FormControl><Input placeholder="Honda CRF250" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="plateNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plat Nomor *</FormLabel>
                    <FormControl><Input placeholder="B 1234 XYZ" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                <FormItem>
                  <FormLabel>Kontak Darurat *</FormLabel>
                  <FormControl><Input placeholder="Nama - 08123456789" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {/* Registration Type */}
              <FormField control={form.control} name="registrationType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipe Pendaftaran *</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'sharing', label: 'Sharing', price: priceMap.sharing },
                      { value: 'single', label: 'Single', price: priceMap.single },
                      { value: 'couple', label: 'Couple', price: priceMap.couple },
                    ].filter(t => t.price > 0).map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => field.onChange(t.value)}
                        className={`p-3 rounded-lg border text-center transition-all ${field.value === t.value ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border hover:border-primary/40'}`}
                      >
                        <p className="text-xs font-medium">{t.label}</p>
                        <p className="text-sm font-bold text-primary">{formatPrice(t.price)}</p>
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              {/* Towing Options */}
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
                  {towingTotal > 0 && (
                    <p className="text-xs text-muted-foreground pt-1 border-t border-border">Tambahan towing: {formatPrice(towingTotal)}</p>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? 'Mendaftar...' : `Kirim Pendaftaran - ${formatPrice(selectedPrice)}`}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
