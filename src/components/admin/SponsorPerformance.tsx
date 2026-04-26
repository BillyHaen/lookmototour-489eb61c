import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Eye, MousePointerClick, Users, ShoppingBag, TrendingUp, DollarSign, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';

interface Props { sponsor: any | null; onClose: () => void; }

export default function SponsorPerformance({ sponsor, onClose }: Props) {
  const [start, setStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [end, setEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ['sponsor-performance', sponsor?.id, start, end],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sponsor_performance' as any, {
        _sponsor_id: sponsor.id, _start: start, _end: end,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!sponsor?.id,
  });

  const totals = data?.[0] || { total_impressions: 0, total_clicks: 0, total_leads: 0, total_conversions: 0, total_revenue: 0, conversion_rate: 0, estimated_payout: 0 };
  const series = (data || []).map((d) => ({ date: format(new Date(d.date), 'dd/MM'), impressions: d.impressions, clicks: d.clicks, leads: d.leads, conversions: d.conversions }));

  const exportCsv = () => {
    if (!data?.length) return;
    const rows = [['Date', 'Impressions', 'Clicks', 'Leads', 'Conversions', 'Revenue']];
    data.forEach((d: any) => rows.push([d.date, d.impressions, d.clicks, d.leads, d.conversions, d.revenue]));
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `sponsor-${sponsor.slug}-performance.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const kpis = [
    { label: 'Impressions', value: totals.total_impressions, icon: Eye },
    { label: 'Clicks', value: totals.total_clicks, icon: MousePointerClick },
    { label: 'Leads', value: totals.total_leads, icon: Users },
    { label: 'Conversions', value: totals.total_conversions, icon: ShoppingBag },
    { label: 'Conv Rate', value: `${totals.conversion_rate}%`, icon: TrendingUp },
    { label: 'Estimated Payout', value: `Rp${Number(totals.estimated_payout).toLocaleString('id')}`, icon: DollarSign },
  ];

  return (
    <Dialog open={!!sponsor} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Performa: {sponsor?.name}</DialogTitle></DialogHeader>

        <div className="flex flex-col md:flex-row gap-3 items-end mb-4">
          <div><Label>Dari</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
          <div><Label>Sampai</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          <Button variant="outline" onClick={exportCsv} disabled={!data?.length}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {kpis.map((k) => (
                <Card key={k.label}><CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><k.icon className="h-3 w-3" /> {k.label}</div>
                  <div className="text-xl font-bold">{k.value}</div>
                </CardContent></Card>
              ))}
            </div>

            {series.length > 0 ? (
              <Card><CardContent className="p-4">
                <h4 className="font-semibold mb-3">Tren Harian</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="impressions" stroke="hsl(var(--muted-foreground))" />
                    <Line type="monotone" dataKey="clicks" stroke="hsl(var(--primary))" />
                    <Line type="monotone" dataKey="leads" stroke="hsl(24 95% 53%)" />
                    <Line type="monotone" dataKey="conversions" stroke="hsl(var(--destructive))" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent></Card>
            ) : (
              <p className="text-center text-muted-foreground py-8">Belum ada data tracking pada rentang tanggal ini.</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
