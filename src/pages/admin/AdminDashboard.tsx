import AdminLayout from './AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Users, ShoppingBag, MessageSquare, TrendingUp, DollarSign, Bike, Heart } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import { formatPrice } from '@/data/events';

const COLORS = [
  'hsl(215, 70%, 35%)', 'hsl(200, 80%, 55%)', 'hsl(160, 60%, 45%)',
  'hsl(45, 90%, 55%)', 'hsl(340, 70%, 55%)', 'hsl(270, 60%, 55%)',
  'hsl(30, 80%, 55%)', 'hsl(180, 60%, 45%)',
];

export default function AdminDashboard() {
  // Basic stats
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [events, regs, products, testimonials, interests] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('event_registrations').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('testimonials').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('event_interests').select('id', { count: 'exact', head: true }),
      ]);
      return {
        events: events.count || 0,
        registrations: regs.count || 0,
        products: products.count || 0,
        pendingTestimonials: testimonials.count || 0,
        interests: interests.count || 0,
      };
    },
  });

  // Registrations with event details for charts
  const { data: chartData } = useQuery({
    queryKey: ['admin-dashboard-charts'],
    queryFn: async () => {
      const [eventsRes, regsRes, interestsRes] = await Promise.all([
        supabase.from('events').select('id, title, price_single, price_sharing, price_couple, touring_style, category, towing_pergi_price, towing_pulang_price').is('deleted_at', null),
        supabase.from('event_registrations').select('id, event_id, payment_status, registration_type, created_at, towing_pergi, towing_pulang'),
        supabase.from('event_interests').select('id, event_id, created_at'),
      ]);

      const events = eventsRes.data || [];
      const regs = regsRes.data || [];
      const interests = interestsRes.data || [];

      // --- Per-event stats ---
      const perEvent = events.map(ev => {
        const eventRegs = regs.filter(r => r.event_id === ev.id);
        const eventInterests = interests.filter(i => i.event_id === ev.id);
        const lunas = eventRegs.filter(r => r.payment_status === 'lunas').length;
        const cicilan = eventRegs.filter(r => r.payment_status?.startsWith('cicilan_')).length;
        const pending = eventRegs.filter(r => r.payment_status === 'pending').length;
        const batal = eventRegs.filter(r => r.payment_status === 'batal').length;

        // Revenue calculation
        let revenue = 0;
        eventRegs.filter(r => r.payment_status !== 'batal').forEach(r => {
          let price = ev.price_single || 0;
          if (r.registration_type === 'sharing') price = ev.price_sharing || 0;
          if (r.registration_type === 'couple') price = ev.price_couple || 0;
          if (r.towing_pergi) price += ev.towing_pergi_price || 0;
          if (r.towing_pulang) price += ev.towing_pulang_price || 0;
          if (r.payment_status === 'lunas') revenue += price;
          else if (r.payment_status?.startsWith('cicilan_')) revenue += price * 0.5; // estimate
        });

        const shortTitle = ev.title.length > 20 ? ev.title.slice(0, 18) + '…' : ev.title;

        return {
          name: shortTitle,
          fullTitle: ev.title,
          lunas,
          cicilan,
          pending,
          batal,
          total: eventRegs.length,
          peminat: eventInterests.length,
          revenue,
        };
      });

      // --- Payment status distribution ---
      const paymentDist = [
        { name: 'Lunas', value: regs.filter(r => r.payment_status === 'lunas').length },
        { name: 'Cicilan', value: regs.filter(r => r.payment_status?.startsWith('cicilan_')).length },
        { name: 'Pending', value: regs.filter(r => r.payment_status === 'pending').length },
        { name: 'Batal', value: regs.filter(r => r.payment_status === 'batal').length },
      ].filter(d => d.value > 0);

      // --- Registration type distribution ---
      const regTypeDist = [
        { name: 'Single', value: regs.filter(r => r.registration_type === 'single').length },
        { name: 'Sharing', value: regs.filter(r => r.registration_type === 'sharing').length },
        { name: 'Couple', value: regs.filter(r => r.registration_type === 'couple').length },
      ].filter(d => d.value > 0);

      // --- Touring style distribution ---
      const styleMap: Record<string, number> = {};
      events.forEach(ev => {
        const style = ev.touring_style || 'unknown';
        const count = regs.filter(r => r.event_id === ev.id).length;
        styleMap[style] = (styleMap[style] || 0) + count;
      });
      const touringStyleDist = Object.entries(styleMap)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .filter(d => d.value > 0);

      // --- Category distribution ---
      const catMap: Record<string, number> = {};
      events.forEach(ev => {
        const cat = ev.category || 'other';
        const count = regs.filter(r => r.event_id === ev.id).length;
        catMap[cat] = (catMap[cat] || 0) + count;
      });
      const categoryDist = Object.entries(catMap)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .filter(d => d.value > 0);

      // --- Registration trend (monthly) ---
      const monthMap: Record<string, number> = {};
      regs.forEach(r => {
        const d = new Date(r.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthMap[key] = (monthMap[key] || 0) + 1;
      });
      const regTrend = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));

      // --- Total revenue ---
      const totalRevenue = perEvent.reduce((sum, e) => sum + e.revenue, 0);

      return { perEvent, paymentDist, regTypeDist, touringStyleDist, categoryDist, regTrend, totalRevenue };
    },
  });

  const summaryCards = [
    { label: 'Total Event', value: stats?.events || 0, icon: CalendarDays },
    { label: 'Total Registrasi', value: stats?.registrations || 0, icon: Users },
    { label: 'Total Peminat', value: stats?.interests || 0, icon: Heart },
    { label: 'Total Produk', value: stats?.products || 0, icon: ShoppingBag },
    { label: 'Testimoni Pending', value: stats?.pendingTestimonials || 0, icon: MessageSquare },
    { label: 'Est. Revenue', value: chartData ? formatPrice(chartData.totalRevenue) : 'Rp 0', icon: DollarSign, isText: true },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium mb-1">{payload[0]?.payload?.fullTitle || label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="text-xs">
            {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? formatPrice(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <h1 className="font-heading font-bold text-2xl mb-6">Dashboard — Marketing Intelligence</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className={`font-bold ${(c as any).isText ? 'text-lg' : 'text-2xl'}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Registrations per Event */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Pendaftaran per Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.perEvent?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.perEvent} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="lunas" name="Lunas" stackId="a" fill={COLORS[0]} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cicilan" name="Cicilan" stackId="a" fill={COLORS[1]} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill={COLORS[3]} />
                  <Bar dataKey="batal" name="Batal" stackId="a" fill={COLORS[4]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">Belum ada data registrasi.</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue per Event */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Estimasi Revenue per Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.perEvent?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.perEvent} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}jt`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">Belum ada data.</p>
            )}
          </CardContent>
        </Card>

        {/* Peminat vs Peserta per Event */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              Peminat vs Peserta per Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.perEvent?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.perEvent} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="peminat" name="Peminat" fill={COLORS[5]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total" name="Peserta" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">Belum ada data.</p>
            )}
          </CardContent>
        </Card>

        {/* Registration Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tren Pendaftaran (Bulanan)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.regTrend?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.regTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" name="Registrasi" stroke={COLORS[0]} fill={COLORS[1]} fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">Belum ada data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Payment Status */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Status Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.paymentDist?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData.paymentDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chartData.paymentDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Belum ada data.</p>
            )}
          </CardContent>
        </Card>

        {/* Registration Type */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Tipe Registrasi</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.regTypeDist?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData.regTypeDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chartData.regTypeDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Belum ada data.</p>
            )}
          </CardContent>
        </Card>

        {/* Touring Style */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Touring Style</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.touringStyleDist?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData.touringStyleDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chartData.touringStyleDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 4) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Belum ada data.</p>
            )}
          </CardContent>
        </Card>

        {/* Category */}
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm">Kategori Event</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData?.categoryDist?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={chartData.categoryDist} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chartData.categoryDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[(i + 6) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Belum ada data.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
