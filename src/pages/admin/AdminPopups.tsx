import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, BarChart3 } from 'lucide-react';
import PopupSlideEditor, { type SlideDraft } from '@/components/admin/PopupSlideEditor';

interface CampaignForm {
  name: string;
  is_active: boolean;
  force_show_logged_in: boolean;
  start_at: string;
  end_at: string;
  target_device: 'all' | 'mobile' | 'desktop';
  frequency: 'once' | 'daily' | 'every_session' | 'always';
  priority: number;
  ab_enabled: boolean;
  ab_variant: 'A' | 'B' | '';
  ab_group_key: string;
}

const EMPTY: CampaignForm = {
  name: '',
  is_active: false,
  force_show_logged_in: false,
  start_at: '',
  end_at: '',
  target_device: 'all',
  frequency: 'once',
  priority: 0,
  ab_enabled: false,
  ab_variant: '',
  ab_group_key: '',
};

function toLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPopups() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY);
  const [slides, setSlides] = useState<SlideDraft[]>([]);
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['admin-popup-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('popup_campaigns')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-popup-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('popup_events')
        .select('campaign_id, event_type');
      if (error) throw error;
      const map: Record<string, { views: number; clicks: number; closes: number }> = {};
      (data || []).forEach((e: any) => {
        if (!map[e.campaign_id]) map[e.campaign_id] = { views: 0, clicks: 0, closes: 0 };
        if (e.event_type === 'view') map[e.campaign_id].views += 1;
        else if (e.event_type === 'click_cta') map[e.campaign_id].clicks += 1;
        else if (e.event_type === 'close' || e.event_type === 'dismiss_outside')
          map[e.campaign_id].closes += 1;
      });
      return map;
    },
  });

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY);
    setSlides([]);
    setOpen(true);
  };

  const openEdit = async (c: any) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      is_active: c.is_active,
      force_show_logged_in: c.force_show_logged_in,
      start_at: toLocal(c.start_at),
      end_at: toLocal(c.end_at),
      target_device: c.target_device,
      frequency: c.frequency,
      priority: c.priority,
      ab_enabled: c.ab_enabled,
      ab_variant: c.ab_variant || '',
      ab_group_key: c.ab_group_key || '',
    });
    const { data } = await supabase
      .from('popup_slides')
      .select('*')
      .eq('campaign_id', c.id)
      .order('order_index', { ascending: true });
    setSlides(
      (data || []).map((s: any) => ({
        id: s.id,
        order_index: s.order_index,
        image_url: s.image_url,
        content_html: s.content_html,
        cta_label: s.cta_label,
        cta_url: s.cta_url,
      }))
    );
    setOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: form.name.trim() || 'Tanpa nama',
        is_active: form.is_active,
        force_show_logged_in: form.force_show_logged_in,
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
        target_device: form.target_device,
        frequency: form.frequency,
        priority: form.priority,
        ab_enabled: form.ab_enabled,
        ab_variant: form.ab_enabled && form.ab_variant ? form.ab_variant : null,
        ab_group_key: form.ab_enabled && form.ab_group_key ? form.ab_group_key : null,
      };
      let campaignId = editId;
      if (editId) {
        const { error } = await supabase.from('popup_campaigns').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('popup_campaigns')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        campaignId = data.id;
      }
      // Replace slides
      if (campaignId) {
        await supabase.from('popup_slides').delete().eq('campaign_id', campaignId);
        if (slides.length > 0) {
          const rows = slides.map((s, idx) => ({
            campaign_id: campaignId,
            order_index: idx,
            image_url: s.image_url,
            content_html: s.content_html,
            cta_label: s.cta_label || null,
            cta_url: s.cta_url || null,
          }));
          const { error } = await supabase.from('popup_slides').insert(rows);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast({ title: 'Tersimpan ✅' });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-popup-campaigns'] });
    },
    onError: (e: any) => toast({ title: 'Gagal menyimpan', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('popup_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Kampanye dihapus' });
      qc.invalidateQueries({ queryKey: ['admin-popup-campaigns'] });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Popup Slider</h1>
            <p className="text-sm text-muted-foreground">
              Kelola popup slider untuk pengunjung mobile/PWA.
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Kampanye Baru
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>A/B</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(campaigns || []).map((c: any) => {
                    const s = stats?.[c.id] || { views: 0, clicks: 0, closes: 0 };
                    const ctr = s.views > 0 ? ((s.clicks / s.views) * 100).toFixed(1) : '0.0';
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          {c.is_active ? (
                            <Badge>Active</Badge>
                          ) : (
                            <Badge variant="outline">Off</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.start_at ? new Date(c.start_at).toLocaleDateString('id-ID') : '—'}
                          {' → '}
                          {c.end_at ? new Date(c.end_at).toLocaleDateString('id-ID') : '∞'}
                        </TableCell>
                        <TableCell className="capitalize text-xs">{c.target_device}</TableCell>
                        <TableCell>
                          {c.ab_enabled ? (
                            <Badge variant="secondary">{c.ab_variant || '?'}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{s.views}</TableCell>
                        <TableCell className="text-right">{s.clicks}</TableCell>
                        <TableCell className="text-right">{ctr}%</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setAnalyticsId(c.id)}>
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Hapus kampanye "${c.name}"?`)) deleteMutation.mutate(c.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!campaigns || campaigns.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Belum ada kampanye.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Editor Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Kampanye' : 'Kampanye Baru'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">Umum</TabsTrigger>
              <TabsTrigger value="schedule">Jadwal & Target</TabsTrigger>
              <TabsTrigger value="ab">A/B Test</TabsTrigger>
              <TabsTrigger value="slides">Slide</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-3 pt-4">
              <div>
                <Label>Nama Kampanye</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prioritas (lebih tinggi = duluan)</Label>
                  <Input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value || '0', 10) })}
                  />
                </div>
                <div>
                  <Label>Frekuensi</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v: any) => setForm({ ...form, frequency: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Sekali per visitor</SelectItem>
                      <SelectItem value="daily">Sekali per hari</SelectItem>
                      <SelectItem value="every_session">Setiap sesi</SelectItem>
                      <SelectItem value="always">Selalu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Aktif</Label>
                  <p className="text-xs text-muted-foreground">Tayangkan ke pengunjung.</p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Force show ke user yang login</Label>
                  <p className="text-xs text-muted-foreground">
                    Default popup hanya untuk visitor yang belum login. Aktifkan untuk override.
                  </p>
                </div>
                <Switch
                  checked={form.force_show_logged_in}
                  onCheckedChange={(v) => setForm({ ...form, force_show_logged_in: v })}
                />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Mulai</Label>
                  <Input
                    type="datetime-local"
                    value={form.start_at}
                    onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Berakhir</Label>
                  <Input
                    type="datetime-local"
                    value={form.end_at}
                    onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Target Device</Label>
                <Select
                  value={form.target_device}
                  onValueChange={(v: any) => setForm({ ...form, target_device: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="mobile">Mobile only</SelectItem>
                    <SelectItem value="desktop">Desktop only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="ab" className="space-y-3 pt-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Aktifkan A/B Testing</Label>
                  <p className="text-xs text-muted-foreground">
                    Buat 2 kampanye dengan group key yang sama, varian A &amp; B.
                  </p>
                </div>
                <Switch
                  checked={form.ab_enabled}
                  onCheckedChange={(v) => setForm({ ...form, ab_enabled: v })}
                />
              </div>
              {form.ab_enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Varian</Label>
                    <Select
                      value={form.ab_variant || ''}
                      onValueChange={(v: any) => setForm({ ...form, ab_variant: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Pilih A atau B" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Group Key</Label>
                    <Input
                      value={form.ab_group_key}
                      onChange={(e) => setForm({ ...form, ab_group_key: e.target.value })}
                      placeholder="mis. promo-akhir-tahun"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="slides" className="pt-4">
              <PopupSlideEditor value={slides} onChange={setSlides} />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <AnalyticsDialog
        campaignId={analyticsId}
        onClose={() => setAnalyticsId(null)}
        campaignName={campaigns?.find((c: any) => c.id === analyticsId)?.name}
      />
    </AdminLayout>
  );
}

function AnalyticsDialog({
  campaignId,
  onClose,
  campaignName,
}: {
  campaignId: string | null;
  onClose: () => void;
  campaignName?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-popup-analytics', campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('popup_events')
        .select('event_type, variant, session_id')
        .eq('campaign_id', campaignId as string);
      if (error) throw error;
      return data || [];
    },
  });

  const summary = useMemo(() => {
    const init = { views: 0, clicks: 0, closes: 0, sessions: new Set<string>() };
    const byVariant: Record<string, typeof init> = { A: { ...init, sessions: new Set() }, B: { ...init, sessions: new Set() }, '_': { ...init, sessions: new Set() } };
    (data || []).forEach((e: any) => {
      const key = e.variant === 'A' || e.variant === 'B' ? e.variant : '_';
      const bucket = byVariant[key];
      if (e.session_id) bucket.sessions.add(e.session_id);
      if (e.event_type === 'view') bucket.views += 1;
      else if (e.event_type === 'click_cta') bucket.clicks += 1;
      else if (e.event_type === 'close' || e.event_type === 'dismiss_outside') bucket.closes += 1;
    });
    return byVariant;
  }, [data]);

  const Row = ({ label, b }: { label: string; b: any }) => {
    const ctr = b.views > 0 ? ((b.clicks / b.views) * 100).toFixed(1) : '0.0';
    const dismiss = b.views > 0 ? ((b.closes / b.views) * 100).toFixed(1) : '0.0';
    return (
      <TableRow>
        <TableCell className="font-medium">{label}</TableCell>
        <TableCell className="text-right">{b.views}</TableCell>
        <TableCell className="text-right">{b.sessions.size}</TableCell>
        <TableCell className="text-right">{b.clicks}</TableCell>
        <TableCell className="text-right">{ctr}%</TableCell>
        <TableCell className="text-right">{dismiss}%</TableCell>
      </TableRow>
    );
  };

  return (
    <Dialog open={!!campaignId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Analytics — {campaignName || ''}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Varian</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Unique</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">Dismiss</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Row label="A" b={summary.A} />
              <Row label="B" b={summary.B} />
              <Row label="No A/B" b={summary._} />
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
