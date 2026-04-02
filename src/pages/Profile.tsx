import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, CalendarDays, LogOut } from 'lucide-react';
import { formatDate, formatPrice } from '@/data/events';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  phone: z.string().max(20).optional(),
  bio: z.string().max(500).optional(),
});

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: registrations } = useQuery({
    queryKey: ['my-registrations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*, events(title, date, location, price, status)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', bio: '' },
  });

  useEffect(() => {
    if (profile) {
      form.reset({ name: profile.name || '', phone: profile.phone || '', bio: profile.bio || '' });
    }
  }, [profile, form]);

  const updateProfile = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const { error } = await supabase.from('profiles').update(values).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Profil berhasil diperbarui! ✅' });
    },
    onError: (e: Error) => {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-heading font-bold text-3xl flex items-center gap-3">
              <User className="h-8 w-8 text-primary" /> Profil Saya
            </h1>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Profil</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => updateProfile.mutate(v))} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. HP</FormLabel>
                      <FormControl><Input placeholder="08123456789" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl><Textarea placeholder="Ceritakan tentang kamu..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Simpan
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" /> Riwayat Pendaftaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!registrations?.length ? (
                <p className="text-muted-foreground text-sm py-4">Belum ada pendaftaran event.</p>
              ) : (
                <div className="space-y-3">
                  {registrations.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="font-medium">{(r as any).events?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {(r as any).events?.date ? formatDate((r as any).events.date) : ''} • {(r as any).events?.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={r.status === 'confirmed' ? 'default' : 'secondary'}>
                          {r.status === 'confirmed' ? 'Terdaftar' : r.status}
                        </Badge>
                        <p className="text-sm font-bold text-primary mt-1">
                          {(r as any).events?.price !== undefined ? formatPrice((r as any).events.price) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
