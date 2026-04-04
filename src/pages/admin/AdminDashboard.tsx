import AdminLayout from './AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, ShoppingBag, MessageSquare } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [events, regs, products, testimonials] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('event_registrations').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return {
        events: events.count || 0,
        registrations: regs.count || 0,
        products: products.count || 0,
        pendingTestimonials: testimonials.count || 0,
      };
    },
  });

  const cards = [
    { label: 'Total Event', value: stats?.events || 0, icon: CalendarDays },
    { label: 'Total Registrasi', value: stats?.registrations || 0, icon: Users },
    { label: 'Total Produk', value: stats?.products || 0, icon: ShoppingBag },
    { label: 'Testimoni Pending', value: stats?.pendingTestimonials || 0, icon: MessageSquare },
  ];

  return (
    <AdminLayout>
      <h1 className="font-heading font-bold text-2xl mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
