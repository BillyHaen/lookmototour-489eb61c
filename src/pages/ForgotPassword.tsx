import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle2 } from 'lucide-react';
import logo from '@/assets/logo.png';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const schema = z.object({ email: z.string().email('Email tidak valid') });

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setLoading(true);
    const { error } = await resetPassword(data.email);
    setLoading(false);
    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mountain className="h-10 w-10 text-primary mx-auto mb-2" />
            <CardTitle className="font-heading text-2xl">Lupa Password</CardTitle>
            <CardDescription>Masukkan email untuk reset password</CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center py-6 gap-4 animate-fade-in">
                <CheckCircle2 className="h-16 w-16 text-accent" />
                <p className="text-center text-muted-foreground">Link reset password sudah dikirim ke email kamu.</p>
                <Button variant="outline" asChild><Link to="/login">Kembali ke Login</Link></Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="email@contoh.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Kirim Link Reset
                  </Button>
                </form>
              </Form>
            )}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline">Kembali ke Login</Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
