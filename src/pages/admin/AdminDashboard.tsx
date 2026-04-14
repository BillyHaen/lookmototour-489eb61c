import { useState, useMemo, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarDays, Users, ShoppingBag, MessageSquare, TrendingUp, DollarSign, Heart, Download, FileText, FileSpreadsheet } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { formatPrice } from '@/data/events';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

const COLORS = [
  'hsl(215, 70%, 35%)', 'hsl(200, 80%, 55%)', 'hsl(160, 60%, 45%)',
  'hsl(45, 90%, 55%)', 'hsl(340, 70%, 55%)', 'hsl(270, 60%, 55%)',
  'hsl(30, 80%, 55%)', 'hsl(180, 60%, 45%)',
];

const PRESET_RANGES = [
  { label: 'Semua', value: 'all' },
  { label: '7 Hari', value: '7d' },
  { label: '30 Hari', value: '30d' },
  { label: '90 Hari', value: '90d' },
  { label: '1 Tahun', value: '1y' },
] as const;

function getPresetDates(preset: string): DateRange | undefined {
  if (preset === 'all') return undefined;
  const now = new Date();
  const from = new Date();
  if (preset === '7d') from.setDate(now.getDate() - 7);
  else if (preset === '30d') from.setDate(now.getDate() - 30);
  else if (preset === '90d') from.setDate(now.getDate() - 90);
  else if (preset === '1y') from.setFullYear(now.getFullYear() - 1);
  return { from, to: now };
}

export default function AdminDashboard() {
  const [activePreset, setActivePreset] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const effectiveRange = activePreset !== 'custom' ? getPresetDates(activePreset) : dateRange;

  const handlePreset = (preset: string) => {
    setActivePreset(preset);
    if (preset !== 'custom') setDateRange(undefined);
  };

  const handleCustomRange = (range: DateRange | undefined) => {
    setDateRange(range);
    setActivePreset('custom');
  };

  // Basic stats (unfiltered)
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

  // Raw data for charts
  const { data: rawData } = useQuery({
    queryKey: ['admin-dashboard-raw'],
    queryFn: async () => {
      const [eventsRes, regsRes, interestsRes] = await Promise.all([
        supabase.from('events').select('id, title, price_single, price_sharing, price_couple, touring_style, category, towing_pergi_price, towing_pulang_price').is('deleted_at', null),
        supabase.from('event_registrations').select('id, event_id, payment_status, registration_type, created_at, towing_pergi, towing_pulang, name, email, phone'),
        supabase.from('event_interests').select('id, event_id, created_at'),
      ]);
      return {
        events: eventsRes.data || [],
        regs: regsRes.data || [],
        interests: interestsRes.data || [],
      };
    },
  });

  // Filter + compute chart data based on date range
  const chartData = useMemo(() => {
    if (!rawData) return null;
    const { events, interests: allInterests } = rawData;
    let regs = rawData.regs;
    let interests = allInterests;

    // Apply date filter
    if (effectiveRange?.from) {
      const from = effectiveRange.from.getTime();
      const to = effectiveRange.to ? effectiveRange.to.getTime() + 86400000 : Date.now();
      regs = regs.filter(r => {
        const t = new Date(r.created_at).getTime();
        return t >= from && t <= to;
      });
      interests = interests.filter(i => {
        const t = new Date(i.created_at).getTime();
        return t >= from && t <= to;
      });
    }

    const perEvent = events.map(ev => {
      const eventRegs = regs.filter(r => r.event_id === ev.id);
      const eventInterests = interests.filter(i => i.event_id === ev.id);
      const lunas = eventRegs.filter(r => r.payment_status === 'lunas').length;
      const cicilan = eventRegs.filter(r => r.payment_status?.startsWith('cicilan_')).length;
      const pending = eventRegs.filter(r => r.payment_status === 'pending').length;
      const batal = eventRegs.filter(r => r.payment_status === 'batal').length;

      let revenue = 0;
      eventRegs.filter(r => r.payment_status !== 'batal').forEach(r => {
        let price = ev.price_single || 0;
        if (r.registration_type === 'sharing') price = ev.price_sharing || 0;
        if (r.registration_type === 'couple') price = ev.price_couple || 0;
        if (r.towing_pergi) price += ev.towing_pergi_price || 0;
        if (r.towing_pulang) price += ev.towing_pulang_price || 0;
        if (r.payment_status === 'lunas') revenue += price;
        else if (r.payment_status?.startsWith('cicilan_')) revenue += price * 0.5;
      });

      const shortTitle = ev.title.length > 20 ? ev.title.slice(0, 18) + '…' : ev.title;
      return { name: shortTitle, fullTitle: ev.title, lunas, cicilan, pending, batal, total: eventRegs.length, peminat: eventInterests.length, revenue };
    });

    const paymentDist = [
      { name: 'Lunas', value: regs.filter(r => r.payment_status === 'lunas').length },
      { name: 'Cicilan', value: regs.filter(r => r.payment_status?.startsWith('cicilan_')).length },
      { name: 'Pending', value: regs.filter(r => r.payment_status === 'pending').length },
      { name: 'Batal', value: regs.filter(r => r.payment_status === 'batal').length },
    ].filter(d => d.value > 0);

    const regTypeDist = [
      { name: 'Single', value: regs.filter(r => r.registration_type === 'single').length },
      { name: 'Sharing', value: regs.filter(r => r.registration_type === 'sharing').length },
      { name: 'Couple', value: regs.filter(r => r.registration_type === 'couple').length },
    ].filter(d => d.value > 0);

    const styleMap: Record<string, number> = {};
    events.forEach(ev => {
      const style = ev.touring_style || 'unknown';
      const count = regs.filter(r => r.event_id === ev.id).length;
      styleMap[style] = (styleMap[style] || 0) + count;
    });
    const touringStyleDist = Object.entries(styleMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })).filter(d => d.value > 0);

    const catMap: Record<string, number> = {};
    events.forEach(ev => {
      const cat = ev.category || 'other';
      const count = regs.filter(r => r.event_id === ev.id).length;
      catMap[cat] = (catMap[cat] || 0) + count;
    });
    const categoryDist = Object.entries(catMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })).filter(d => d.value > 0);

    const monthMap: Record<string, number> = {};
    regs.forEach(r => {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });
    const regTrend = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));

    const totalRevenue = perEvent.reduce((sum, e) => sum + e.revenue, 0);
    const filteredRegCount = regs.length;
    const filteredInterestCount = interests.length;

    return { perEvent, paymentDist, regTypeDist, touringStyleDist, categoryDist, regTrend, totalRevenue, filteredRegCount, filteredInterestCount, regs };
  }, [rawData, effectiveRange]);

  // --- Export CSV ---
  const exportCSV = useCallback(() => {
    if (!chartData || !rawData) return;
    const eventMap = new Map(rawData.events.map(e => [e.id, e.title]));
    const rows = chartData.regs.map(r => ({
      Nama: r.name,
      Email: r.email,
      Telepon: r.phone,
      Event: eventMap.get(r.event_id) || r.event_id,
      Tipe: r.registration_type,
      Status_Bayar: r.payment_status,
      Towing_Pergi: r.towing_pergi ? 'Ya' : 'Tidak',
      Towing_Pulang: r.towing_pulang ? 'Ya' : 'Tidak',
      Tanggal_Daftar: new Date(r.created_at).toLocaleDateString('id-ID'),
    }));

    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${(r as any)[h] || ''}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = effectiveRange?.from ? `_${format(effectiveRange.from, 'yyyyMMdd')}-${effectiveRange.to ? format(effectiveRange.to, 'yyyyMMdd') : 'now'}` : '';
    a.download = `laporan-registrasi${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chartData, rawData, effectiveRange]);

  // --- Export PDF (summary report) ---
  const exportPDF = useCallback(() => {
    if (!chartData || !rawData) return;
    const eventMap = new Map(rawData.events.map(e => [e.id, e.title]));
    const dateLabel = effectiveRange?.from
      ? `${format(effectiveRange.from, 'dd MMM yyyy', { locale: idLocale })} - ${effectiveRange.to ? format(effectiveRange.to, 'dd MMM yyyy', { locale: idLocale }) : 'Sekarang'}`
      : 'Semua Periode';

    const lines: string[] = [];
    lines.push('LAPORAN MARKETING INTELLIGENCE - LOOKMOTOTOUR');
    lines.push(`Periode: ${dateLabel}`);
    lines.push(`Tanggal Cetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale })}`);
    lines.push('');
    lines.push('=== RINGKASAN ===');
    lines.push(`Total Registrasi (periode): ${chartData.filteredRegCount}`);
    lines.push(`Total Peminat (periode): ${chartData.filteredInterestCount}`);
    lines.push(`Estimasi Revenue: ${formatPrice(chartData.totalRevenue)}`);
    lines.push('');
    lines.push('=== DETAIL PER EVENT ===');
    chartData.perEvent.forEach(e => {
      if (e.total === 0 && e.peminat === 0) return;
      lines.push(`\n📌 ${e.fullTitle}`);
      lines.push(`   Peserta: ${e.total} (Lunas: ${e.lunas}, Cicilan: ${e.cicilan}, Pending: ${e.pending}, Batal: ${e.batal})`);
      lines.push(`   Peminat: ${e.peminat}`);
      lines.push(`   Revenue: ${formatPrice(e.revenue)}`);
    });
    lines.push('\n\n=== DISTRIBUSI STATUS PEMBAYARAN ===');
    chartData.paymentDist.forEach(d => lines.push(`   ${d.name}: ${d.value}`));
    lines.push('\n=== DISTRIBUSI TIPE REGISTRASI ===');
    chartData.regTypeDist.forEach(d => lines.push(`   ${d.name}: ${d.value}`));
    lines.push('\n=== DISTRIBUSI TOURING STYLE ===');
    chartData.touringStyleDist.forEach(d => lines.push(`   ${d.name}: ${d.value}`));
    lines.push('\n=== DISTRIBUSI KATEGORI EVENT ===');
    chartData.categoryDist.forEach(d => lines.push(`   ${d.name}: ${d.value}`));
    lines.push('\n\n=== DAFTAR PESERTA ===');
    lines.push('Nama | Event | Tipe | Status Bayar | Tanggal');
    lines.push('-'.repeat(80));
    chartData.regs.forEach(r => {
      lines.push(`${r.name} | ${eventMap.get(r.event_id) || '-'} | ${r.registration_type} | ${r.payment_status} | ${new Date(r.created_at).toLocaleDateString('id-ID')}`);
    });

    // Create printable HTML → open in new window for PDF print
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Laporan Marketing - LookMotoTour</title>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; font-size: 12px; line-height: 1.6; color: #1a1a2e; }
  h1 { font-size: 18px; color: #1a3a5c; border-bottom: 2px solid #1a3a5c; padding-bottom: 8px; }
  h2 { font-size: 14px; color: #1a3a5c; margin-top: 24px; }
  .meta { color: #666; font-size: 11px; margin-bottom: 20px; }
  .summary { display: flex; gap: 24px; margin: 16px 0; }
  .summary-card { background: #f0f4f8; padding: 12px 16px; border-radius: 8px; flex: 1; }
  .summary-card .label { font-size: 10px; color: #666; text-transform: uppercase; }
  .summary-card .value { font-size: 20px; font-weight: bold; color: #1a3a5c; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
  th { background: #1a3a5c; color: white; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  .event-block { margin: 12px 0; padding: 10px; background: #f8fafc; border-left: 3px solid #1a3a5c; border-radius: 4px; }
  .event-title { font-weight: bold; color: #1a3a5c; }
  .dist-row { display: flex; gap: 32px; flex-wrap: wrap; margin-top: 8px; }
  .dist-item { min-width: 120px; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<h1>📊 Laporan Marketing Intelligence — LookMotoTour</h1>
<div class="meta">Periode: ${dateLabel} &nbsp;|&nbsp; Dicetak: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: idLocale })}</div>

<div class="summary">
  <div class="summary-card"><div class="label">Registrasi</div><div class="value">${chartData.filteredRegCount}</div></div>
  <div class="summary-card"><div class="label">Peminat</div><div class="value">${chartData.filteredInterestCount}</div></div>
  <div class="summary-card"><div class="label">Est. Revenue</div><div class="value">${formatPrice(chartData.totalRevenue)}</div></div>
</div>

<h2>📌 Detail per Event</h2>
${chartData.perEvent.filter(e => e.total > 0 || e.peminat > 0).map(e => `
<div class="event-block">
  <div class="event-title">${e.fullTitle}</div>
  <div>Peserta: ${e.total} (Lunas: ${e.lunas}, Cicilan: ${e.cicilan}, Pending: ${e.pending}, Batal: ${e.batal}) &nbsp;|&nbsp; Peminat: ${e.peminat} &nbsp;|&nbsp; Revenue: ${formatPrice(e.revenue)}</div>
</div>`).join('')}

<h2>📊 Distribusi</h2>
<div class="dist-row">
  <div class="dist-item"><strong>Status Pembayaran</strong>${chartData.paymentDist.map(d => `<div>${d.name}: ${d.value}</div>`).join('')}</div>
  <div class="dist-item"><strong>Tipe Registrasi</strong>${chartData.regTypeDist.map(d => `<div>${d.name}: ${d.value}</div>`).join('')}</div>
  <div class="dist-item"><strong>Touring Style</strong>${chartData.touringStyleDist.map(d => `<div>${d.name}: ${d.value}</div>`).join('')}</div>
  <div class="dist-item"><strong>Kategori</strong>${chartData.categoryDist.map(d => `<div>${d.name}: ${d.value}</div>`).join('')}</div>
</div>

<h2>📋 Daftar Peserta (${chartData.regs.length})</h2>
<table>
<thead><tr><th>Nama</th><th>Event</th><th>Tipe</th><th>Status Bayar</th><th>Tanggal</th></tr></thead>
<tbody>
${chartData.regs.map(r => `<tr><td>${r.name}</td><td>${eventMap.get(r.event_id) || '-'}</td><td>${r.registration_type}</td><td>${r.payment_status}</td><td>${new Date(r.created_at).toLocaleDateString('id-ID')}</td></tr>`).join('')}
</tbody></table>

<script>window.onload = () => window.print();</script>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  }, [chartData, rawData, effectiveRange]);

  const summaryCards = [
    { label: 'Total Event', value: stats?.events || 0, icon: CalendarDays },
    { label: 'Registrasi', value: chartData?.filteredRegCount ?? stats?.registrations ?? 0, icon: Users },
    { label: 'Peminat', value: chartData?.filteredInterestCount ?? stats?.interests ?? 0, icon: Heart },
    { label: 'Produk', value: stats?.products || 0, icon: ShoppingBag },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-heading font-bold text-2xl">Dashboard — Marketing Intelligence</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV} disabled={!chartData?.regs?.length}>
            <FileSpreadsheet className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportPDF} disabled={!chartData?.regs?.length}>
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground mr-1">Filter Periode:</span>
            {PRESET_RANGES.map(p => (
              <Button
                key={p.value}
                variant={activePreset === p.value ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => handlePreset(p.value)}
              >
                {p.label}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={activePreset === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  {dateRange?.from
                    ? `${format(dateRange.from, 'dd/MM/yy')}${dateRange.to ? ' - ' + format(dateRange.to, 'dd/MM/yy') : ''}`
                    : 'Pilih Tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleCustomRange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {activePreset !== 'all' && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => handlePreset('all')}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
                  <Bar dataKey="lunas" name="Lunas" stackId="a" fill={COLORS[0]} />
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
        {[
          { title: 'Status Pembayaran', data: chartData?.paymentDist, offset: 0 },
          { title: 'Tipe Registrasi', data: chartData?.regTypeDist, offset: 2 },
          { title: 'Touring Style', data: chartData?.touringStyleDist, offset: 4 },
          { title: 'Kategori Event', data: chartData?.categoryDist, offset: 6 },
        ].map(({ title, data, offset }) => (
          <Card key={title}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.length ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[(i + offset) % COLORS.length]} />
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
        ))}
      </div>
    </AdminLayout>
  );
}
