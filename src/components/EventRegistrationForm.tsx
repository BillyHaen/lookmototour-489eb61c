import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/data/events';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { DbEvent } from '@/hooks/useEvents';
import { useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  name: z.string().trim().min(3, 'Nama minimal 3 karakter').max(100),
  email: z.string().trim().email('Email tidak valid').max(255),
  phone: z.string().trim().min(10, 'Nomor HP minimal 10 digit').max(15).regex(/^[0-9+\-\s]+$/, 'Format nomor tidak valid'),
  motorType: z.string().trim().min(2, 'Masukkan tipe motor').max(100),
  plateNumber: z.string().trim().min(3, 'Masukkan plat nomor').max(15),
  emergencyContact: z.string().trim().min(10, 'Masukkan kontak darurat').max(100),
  registrationType: z.enum(['sharing', 'single', 'couple']),
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

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', motorType: '', plateNumber: '', emergencyContact: '', registrationType: 'single', notes: '' },
  });

  const selectedType = form.watch('registrationType');
  const priceMap: Record<string, number> = {
    sharing: (event as any).price_sharing || 0,
    single: (event as any).price_single || event.price || 0,
    couple: (event as any).price_couple || 0,
  };
  const selectedPrice = priceMap[selectedType] || 0;

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
    toast({ title: 'Pendaftaran berhasil! 🎉', description: `Kamu sudah terdaftar untuk ${event.title}` });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full text-base font-semibold" disabled={isFull || event.status === 'completed'}>
          {isFull ? 'Event Penuh' : event.status === 'completed' ? 'Event Selesai' : `Daftar Sekarang - ${formatPrice(event.price)}`}
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
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl><Textarea placeholder="Alergi, kebutuhan khusus, dll..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {loading ? 'Mendaftar...' : 'Kirim Pendaftaran'}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
