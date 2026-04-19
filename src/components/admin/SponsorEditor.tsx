import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ImageUpload from '@/components/ImageUpload';
import RichTextEditor from '@/components/RichTextEditor';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const CATEGORIES = ['dealer', 'gear', 'accessories', 'apparel', 'service', 'other'];
const PACKAGE_TYPES = ['bronze', 'silver', 'gold', 'custom'];
const BENEFIT_TYPES = ['discount', 'free_item', 'experience', 'test_ride'];
const MEDIA_TYPES = ['banner', 'campaign', 'video'];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sponsor: any | null;
}

export default function SponsorEditor({ open, onOpenChange, sponsor }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({
    name: '', slug: '', logo_url: '', hero_image_url: '', website_url: '',
    tagline: '', description: '', category: 'other', status: 'active',
  });

  useEffect(() => {
    if (sponsor) setForm({ ...sponsor });
    else setForm({ name: '', slug: '', logo_url: '', hero_image_url: '', website_url: '', tagline: '', description: '', category: 'other', status: 'active' });
  }, [sponsor, open]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = { ...form, slug: form.slug || slugify(form.name) };
      if (form.id) {
        const { error } = await (supabase.from('sponsors' as any) as any).update(payload).eq('id', form.id);
        if (error) throw error;
        return form.id;
      } else {
        const { data, error } = await (supabase.from('sponsors' as any) as any).insert(payload).select().single();
        if (error) throw error;
        return (data as any).id;
      }
    },
    onSuccess: (id) => {
      toast({ title: 'Tersimpan' });
      qc.invalidateQueries({ queryKey: ['admin-sponsors'] });
      qc.invalidateQueries({ queryKey: ['sponsors', 'active'] });
      if (!form.id) setForm((f: any) => ({ ...f, id }));
    },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{sponsor ? 'Edit Sponsor' : 'Tambah Sponsor'}</DialogTitle></DialogHeader>

        <Tabs defaultValue="profile">
          <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-4">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="packages" disabled={!form.id}>Paket</TabsTrigger>
            <TabsTrigger value="benefits" disabled={!form.id}>Benefit</TabsTrigger>
            <TabsTrigger value="trips" disabled={!form.id}>Trip</TabsTrigger>
            <TabsTrigger value="media" disabled={!form.id}>Media</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nama Sponsor *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Website URL</Label>
                <Input value={form.website_url || ''} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="md:col-span-2">
                <Label>Tagline</Label>
                <Input value={form.tagline || ''} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              </div>
              <div>
                <Label>Logo</Label>
                <ImageUpload value={form.logo_url || ''} onChange={(url) => setForm({ ...form, logo_url: url })} bucket="sponsor-assets" label="Logo" />
              </div>
              <div>
                <Label>Hero Image</Label>
                <ImageUpload value={form.hero_image_url || ''} onChange={(url) => setForm({ ...form, hero_image_url: url })} bucket="sponsor-assets" label="Hero" />
              </div>
              <div className="md:col-span-2">
                <Label>Deskripsi</Label>
                <RichTextEditor value={form.description || ''} onChange={(v) => setForm({ ...form, description: v })} />
              </div>
            </div>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.name}>
              {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Simpan Profil
            </Button>
          </TabsContent>

          <TabsContent value="packages"><PackagesTab sponsorId={form.id} /></TabsContent>
          <TabsContent value="benefits"><BenefitsTab sponsorId={form.id} /></TabsContent>
          <TabsContent value="trips"><TripsTab sponsorId={form.id} /></TabsContent>
          <TabsContent value="media"><MediaTab sponsorId={form.id} /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PackagesTab({ sponsorId }: { sponsorId: string }) {
  const qc = useQueryClient();
  const { data: packages } = useQuery({
    queryKey: ['sponsor-packages', sponsorId],
    queryFn: async () => {
      const { data } = await (supabase.from('sponsor_packages' as any) as any).select('*').eq('sponsor_id', sponsorId);
      return data || [];
    },
  });
  const [form, setForm] = useState<any>({ package_type: 'bronze', base_price: 0, cost_per_click: 0, cost_per_lead: 0, cost_per_conversion: 0, is_active: true });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from('sponsor_packages' as any) as any).insert({ ...form, sponsor_id: sponsorId });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: 'Paket ditambahkan' }); qc.invalidateQueries({ queryKey: ['sponsor-packages', sponsorId] }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await (supabase.from('sponsor_packages' as any) as any).delete().eq('id', id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsor-packages', sponsorId] }),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted rounded-lg">
        <div>
          <Label>Tipe</Label>
          <Select value={form.package_type} onValueChange={(v) => setForm({ ...form, package_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PACKAGE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Base Price (Rp)</Label><Input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: +e.target.value })} /></div>
        <div><Label>Cost / Click</Label><Input type="number" value={form.cost_per_click} onChange={(e) => setForm({ ...form, cost_per_click: +e.target.value })} /></div>
        <div><Label>Cost / Lead</Label><Input type="number" value={form.cost_per_lead} onChange={(e) => setForm({ ...form, cost_per_lead: +e.target.value })} /></div>
        <div><Label>Cost / Conversion</Label><Input type="number" value={form.cost_per_conversion} onChange={(e) => setForm({ ...form, cost_per_conversion: +e.target.value })} /></div>
        <div className="flex items-end">
          <Button onClick={() => save.mutate()} disabled={save.isPending}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
        </div>
      </div>

      <div className="space-y-2">
        {(packages || []).map((p: any) => (
          <Card key={p.id}><CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="capitalize">{p.package_type}</Badge>
              <span className="text-sm">Base Rp{Number(p.base_price).toLocaleString('id')}</span>
              <span className="text-xs text-muted-foreground">CPC {p.cost_per_click} • CPL {p.cost_per_lead} • CPCV {p.cost_per_conversion}</span>
              {p.is_active && <Badge variant="outline">Aktif</Badge>}
            </div>
            <Button size="sm" variant="ghost" onClick={() => del.mutate(p.id)}><Trash2 className="h-3 w-3" /></Button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

function BenefitsTab({ sponsorId }: { sponsorId: string }) {
  const qc = useQueryClient();
  const { data: benefits } = useQuery({
    queryKey: ['sponsor-benefits-admin', sponsorId],
    queryFn: async () => {
      const { data } = await (supabase.from('sponsor_benefits' as any) as any).select('*').eq('sponsor_id', sponsorId);
      return data || [];
    },
  });
  const { data: events } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('id, title').is('deleted_at', null);
      return data || [];
    },
  });
  const [form, setForm] = useState<any>({ title: '', description: '', type: 'discount', terms: '', quota: null, valid_until: '', applicable_trips: [], is_active: true });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, sponsor_id: sponsorId, valid_until: form.valid_until || null, quota: form.quota || null };
      const { error } = await (supabase.from('sponsor_benefits' as any) as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Benefit ditambahkan' });
      qc.invalidateQueries({ queryKey: ['sponsor-benefits-admin', sponsorId] });
      setForm({ title: '', description: '', type: 'discount', terms: '', quota: null, valid_until: '', applicable_trips: [], is_active: true });
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await (supabase.from('sponsor_benefits' as any) as any).delete().eq('id', id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsor-benefits-admin', sponsorId] }),
  });

  const toggleTrip = (id: string) => {
    setForm((f: any) => ({
      ...f,
      applicable_trips: f.applicable_trips.includes(id) ? f.applicable_trips.filter((x: string) => x !== id) : [...f.applicable_trips, id],
    }));
  };

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><Label>Judul *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div>
            <Label>Tipe</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BENEFIT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Quota (kosong = unlimited)</Label><Input type="number" value={form.quota || ''} onChange={(e) => setForm({ ...form, quota: e.target.value ? +e.target.value : null })} /></div>
          <div><Label>Berlaku hingga</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
        </div>
        <div><Label>Deskripsi</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div><Label>Syarat & Ketentuan</Label><Textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={2} /></div>
        <div>
          <Label>Trip yang berlaku (kosong = semua trip sponsor)</Label>
          <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto">
            {(events || []).map((e: any) => (
              <button key={e.id} type="button" onClick={() => toggleTrip(e.id)}
                className={`text-xs px-2 py-1 rounded-full border ${form.applicable_trips.includes(e.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}>
                {e.title}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending || !form.title}><Plus className="h-4 w-4 mr-1" /> Tambah Benefit</Button>
      </CardContent></Card>

      <div className="space-y-2">
        {(benefits || []).map((b: any) => (
          <Card key={b.id}><CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2"><Badge>{b.type}</Badge><span className="font-medium">{b.title}</span></div>
              <p className="text-xs text-muted-foreground mt-1">Klaim: {b.claimed_count}{b.quota ? `/${b.quota}` : ''} {b.valid_until && `• s/d ${b.valid_until}`}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => del.mutate(b.id)}><Trash2 className="h-3 w-3" /></Button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

function TripsTab({ sponsorId }: { sponsorId: string }) {
  const qc = useQueryClient();
  const { data: events } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('id, title').is('deleted_at', null);
      return data || [];
    },
  });
  const { data: relations } = useQuery({
    queryKey: ['sponsor-trips', sponsorId],
    queryFn: async () => {
      const { data } = await (supabase.from('sponsor_trip_relations' as any) as any)
        .select('*, events(title)').eq('sponsor_id', sponsorId);
      return data || [];
    },
  });
  const [eventId, setEventId] = useState('');
  const [priority, setPriority] = useState(0);

  const add = useMutation({
    mutationFn: async () => {
      if (!eventId) throw new Error('Pilih event');
      const { error } = await (supabase.from('sponsor_trip_relations' as any) as any).insert({ sponsor_id: sponsorId, event_id: eventId, priority });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: 'Trip ditambahkan' }); qc.invalidateQueries({ queryKey: ['sponsor-trips', sponsorId] }); setEventId(''); setPriority(0); },
    onError: (e: any) => toast({ title: 'Gagal', description: e.message, variant: 'destructive' }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await (supabase.from('sponsor_trip_relations' as any) as any).delete().eq('id', id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsor-trips', sponsorId] }),
  });

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label>Event</Label>
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger><SelectValue placeholder="Pilih event..." /></SelectTrigger>
            <SelectContent>{(events || []).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="w-24"><Label>Prioritas</Label><Input type="number" value={priority} onChange={(e) => setPriority(+e.target.value)} /></div>
        <Button onClick={() => add.mutate()}><Plus className="h-4 w-4" /></Button>
      </div>

      <div className="space-y-2">
        {(relations || []).map((r: any) => (
          <Card key={r.id}><CardContent className="p-3 flex justify-between items-center">
            <div><span className="font-medium">{r.events?.title}</span><Badge variant="outline" className="ml-2">Prio {r.priority}</Badge></div>
            <Button size="sm" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-3 w-3" /></Button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

function MediaTab({ sponsorId }: { sponsorId: string }) {
  const qc = useQueryClient();
  const { data: media } = useQuery({
    queryKey: ['sponsor-media-admin', sponsorId],
    queryFn: async () => {
      const { data } = await (supabase.from('sponsor_media' as any) as any).select('*').eq('sponsor_id', sponsorId).order('sort_order');
      return data || [];
    },
  });
  const [form, setForm] = useState<any>({ type: 'banner', url: '', title: '', sort_order: 0 });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from('sponsor_media' as any) as any).insert({ ...form, sponsor_id: sponsorId });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: 'Media ditambahkan' }); qc.invalidateQueries({ queryKey: ['sponsor-media-admin', sponsorId] }); setForm({ type: 'banner', url: '', title: '', sort_order: 0 }); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await (supabase.from('sponsor_media' as any) as any).delete().eq('id', id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sponsor-media-admin', sponsorId] }),
  });

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Tipe</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MEDIA_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Judul</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
        </div>
        {form.type === 'video' ? (
          <div><Label>URL Video</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
        ) : (
          <div><Label>Upload</Label><ImageUpload value={form.url} onChange={(url) => setForm({ ...form, url: url })} bucket="sponsor-assets" /></div>
        )}
        <Button onClick={() => add.mutate()} disabled={add.isPending || !form.url}><Plus className="h-4 w-4 mr-1" /> Tambah Media</Button>
      </CardContent></Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {(media || []).map((m: any) => (
          <Card key={m.id}><CardContent className="p-2">
            {m.type === 'video' ? (
              <video src={m.url} className="w-full aspect-video object-cover rounded" />
            ) : (
              <img src={m.url} alt={m.title} className="w-full aspect-video object-cover rounded" />
            )}
            <div className="flex justify-between items-center mt-2">
              <Badge variant="outline" className="text-xs">{m.type}</Badge>
              <Button size="sm" variant="ghost" onClick={() => del.mutate(m.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
