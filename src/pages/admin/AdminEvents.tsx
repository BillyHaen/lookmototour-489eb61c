import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/RichTextEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { formatPrice, formatDate, formatTentativeMonth, RIDER_LEVELS, MOTOR_TYPES, TOURING_STYLES, FATIGUE_LABELS } from '@/data/events';
import { Loader2, Plus, Pencil, Trash2, CalendarDays, Users, Heart } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import AdminEventParticipants from './AdminEventParticipants';
import AdminEventInterests from './AdminEventInterests';
import EventImageUpload from '@/components/EventImageUpload';

interface EventForm {
  title: string;
  slug: string;
  description: string;
  category: string;
  date: string;
  end_date: string;
  location: string;
  price_sharing: number;
  price_single: number;
  price_couple: number;
  max_participants: number;
  image_url: string;
  status: string;
  difficulty: string;
  distance: string;
  highlights: string;
  requirements: string;
  includes: string;
  excludes: string;
  insurance_enabled: boolean;
  insurance_description: string;
  towing_enabled: boolean;
  towing_description: string;
  towing_pergi_price: number;
  towing_pulang_price: number;
  rider_level: string;
  motor_types: string[];
  touring_style: string;
  riding_hours_per_day: number;
  fatigue_level: number;
  tentative_month: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const emptyForm: EventForm = {
  title: '', slug: '', description: '', category: 'touring', date: '', end_date: '',
  location: '', price_sharing: 0, price_single: 0, price_couple: 0, max_participants: 30, image_url: '', status: 'upcoming',
  difficulty: 'sedang', distance: '', highlights: '', requirements: '',
  includes: '', excludes: '',
  insurance_enabled: false, insurance_description: '',
  towing_enabled: false, towing_description: '', towing_pergi_price: 0, towing_pulang_price: 0,
  rider_level: 'all', motor_types: [], touring_style: 'adventure', riding_hours_per_day: 0, fatigue_level: 1,
  tentative_month: '',
};

interface Itinerary { id?: string; day_number: number; date: string; title: string; description: string; }

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [participantsEvent, setParticipantsEvent] = useState<{ id: string; title: string } | null>(null);
  const [interestsEvent, setInterestsEvent] = useState<{ id: string; title: string } | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').is('deleted_at', null).order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (statusOverride?: string) => {
      const finalStatus = statusOverride || form.status;
      const slug = form.slug || generateSlug(form.title);
      const isTentative = !!form.tentative_month;
      const dateValue = isTentative && !form.date ? `${form.tentative_month}-01T00:00` : form.date;
      const payload = {
        title: form.title, slug, description: form.description, category: form.category,
        date: dateValue, end_date: form.end_date || null, location: form.location,
        price: form.price_single, price_sharing: form.price_sharing, price_single: form.price_single, price_couple: form.price_couple,
        max_participants: form.max_participants, image_url: form.image_url,
        status: finalStatus, difficulty: form.difficulty, distance: form.distance,
        highlights: form.highlights.split(',').map(h => h.trim()).filter(Boolean),
        requirements: form.requirements.split(',').map(r => r.trim()).filter(Boolean),
        includes: form.includes.split(',').map(i => i.trim()).filter(Boolean),
        excludes: form.excludes.split(',').map(e => e.trim()).filter(Boolean),
        insurance_enabled: form.insurance_enabled,
        insurance_description: form.insurance_description,
        towing_enabled: form.towing_enabled,
        towing_description: form.towing_description,
        towing_pergi_price: form.towing_pergi_price,
        towing_pulang_price: form.towing_pulang_price,
        rider_level: form.rider_level,
        motor_types: form.motor_types,
        touring_style: form.touring_style,
        riding_hours_per_day: form.riding_hours_per_day,
        fatigue_level: form.fatigue_level,
        tentative_month: form.tentative_month || null,
      };

      let eventId = editId;
      if (editId) {
        const { error } = await supabase.from('events').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('events').insert(payload).select('id').single();
        if (error) throw error;
        eventId = data.id;
      }

      // Save itineraries
      if (eventId) {
        // Delete old ones first
        await supabase.from('event_itineraries' as any).delete().eq('event_id', eventId);
        if (itineraries.length > 0) {
          const rows = itineraries.map(it => ({
            event_id: eventId!,
            day_number: it.day_number,
            date: it.date || null,
            title: it.title,
            description: it.description,
          }));
          await (supabase.from('event_itineraries' as any) as any).insert(rows);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({ title: editId ? 'Event diperbarui ✅' : 'Event ditambahkan ✅' });
      setOpen(false);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      // Check if any participant has paid (lunas)
      const { data: paidRegs } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', id)
        .eq('payment_status', 'lunas')
        .limit(1);

      if (paidRegs && paidRegs.length > 0) {
        throw new Error('Tidak bisa menghapus event yang memiliki peserta dengan status pembayaran LUNAS.');
      }

      const { error } = await supabase.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({ title: 'Event dihapus ✅' });
    },
    onError: (e: Error) => toast({ title: 'Gagal menghapus', description: e.message, variant: 'destructive' }),
  });

  const openCreate = () => { setEditId(null); setForm(emptyForm); setItineraries([]); setOpen(true); };

  const openEdit = async (event: any) => {
    setEditId(event.id);
    setForm({
      title: event.title, slug: (event as any).slug || '', description: event.description, category: event.category,
      date: event.date?.slice(0, 16) || '', end_date: event.end_date?.slice(0, 16) || '',
      location: event.location, price_sharing: event.price_sharing || 0, price_single: event.price_single || event.price || 0, price_couple: event.price_couple || 0, max_participants: event.max_participants,
      image_url: event.image_url || '', status: event.status, difficulty: event.difficulty,
      distance: event.distance || '', highlights: (event.highlights || []).join(', '),
      requirements: (event.requirements || []).join(', '),
      includes: ((event as any).includes || []).join(', '),
      excludes: ((event as any).excludes || []).join(', '),
      insurance_enabled: event.insurance_enabled || false,
      insurance_description: event.insurance_description || '',
      towing_enabled: (event as any).towing_enabled || false,
      towing_description: (event as any).towing_description || '',
      towing_pergi_price: (event as any).towing_pergi_price || 0,
      towing_pulang_price: (event as any).towing_pulang_price || 0,
      rider_level: event.rider_level || 'all',
      motor_types: event.motor_types || [],
      touring_style: event.touring_style || 'adventure',
      riding_hours_per_day: event.riding_hours_per_day || 0,
      fatigue_level: event.fatigue_level || 1,
      tentative_month: event.tentative_month || '',
    });
    // Load itineraries
    const { data } = await (supabase.from('event_itineraries' as any) as any).select('*').eq('event_id', event.id).order('day_number');
    setItineraries((data || []).map((it: any) => ({
      id: it.id, day_number: it.day_number, date: it.date || '', title: it.title, description: it.description,
    })));
    setOpen(true);
  };

  const addItineraryDay = () => {
    const nextDay = itineraries.length + 1;
    setItineraries([...itineraries, { day_number: nextDay, date: '', title: '', description: '' }]);
  };

  const updateItinerary = (index: number, field: keyof Itinerary, value: string | number) => {
    const updated = [...itineraries];
    (updated[index] as any)[field] = value;
    setItineraries(updated);
  };

  const removeItinerary = (index: number) => {
    setItineraries(itineraries.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Kelola Event</h1>
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Tambah Event</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {events?.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">{event.title}</p>
                  <Badge variant={event.status === 'draft' ? 'outline' : event.status === 'upcoming' ? 'default' : 'secondary'}>
                    {event.status === 'draft' ? '📝 Draft' : event.status}
                  </Badge>
                  {(event as any).tentative_month && <Badge variant="outline" className="text-xs">📅 Tentative</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {(event as any).tentative_month ? `${formatTentativeMonth((event as any).tentative_month)} (Tentative)` : formatDate(event.date)} • {event.location} • S:{formatPrice((event as any).price_sharing || 0)} / I:{formatPrice((event as any).price_single || event.price)} / C:{formatPrice((event as any).price_couple || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{event.current_participants}/{event.max_participants} peserta</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {(event as any).force_full && <Badge variant="destructive" className="text-xs">Slot Penuh</Badge>}
                <Button
                  variant={(event as any).force_full ? "destructive" : "outline"}
                  size="sm"
                  title={`${(event as any).force_full ? 'Buka' : 'Tutup'} Pendaftaran`}
                  onClick={async () => {
                    const newVal = !(event as any).force_full;
                    await supabase.from('events').update({ force_full: newVal } as any).eq('id', event.id);
                    queryClient.invalidateQueries({ queryKey: ['admin-events'] });
                    queryClient.invalidateQueries({ queryKey: ['events'] });
                    toast({ title: newVal ? 'Pendaftaran ditutup (Slot Penuh) 🔒' : 'Pendaftaran dibuka kembali ✅' });
                  }}
                >
                  {(event as any).force_full ? '🔒' : '🔓'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setParticipantsEvent({ id: event.id, title: event.title })} title="Lihat Peserta">
                  <Users className="h-4 w-4" />
                </Button>
                {(event as any).tentative_month && (
                  <Button variant="outline" size="sm" onClick={() => setInterestsEvent({ id: event.id, title: event.title })} title="Lihat Peminat">
                    <Heart className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => openEdit(event)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => { if (confirm('Hapus event ini?')) deleteMutation.mutate({ id: event.id }); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {!events?.length && <p className="text-muted-foreground text-center py-8">Belum ada event.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Event' : 'Tambah Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Judul Event" value={form.title} onChange={(e) => {
              const newTitle = e.target.value;
              const autoSlug = !editId || form.slug === generateSlug(form.title);
              setForm({ ...form, title: newTitle, ...(autoSlug ? { slug: generateSlug(newTitle) } : {}) });
            }} />
            <div>
              <label className="text-sm font-medium mb-1 block">Slug URL</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">/events/</span>
                <Input placeholder="slug-url-event" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Otomatis dari judul. Bisa diedit manual.</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Deskripsi Event</label>
              <RichTextEditor value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Deskripsi event..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="touring">Touring</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="race">Race</SelectItem>
                  <SelectItem value="gathering">Gathering</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mudah">Mudah</SelectItem>
                  <SelectItem value="sedang">Sedang</SelectItem>
                  <SelectItem value="sulit">Sulit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Tentative Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <Switch
                id="tentative"
                checked={!!form.tentative_month}
                onCheckedChange={(checked) => {
                  if (checked) {
                    const now = new Date();
                    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    setForm({ ...form, tentative_month: month, date: '' });
                  } else {
                    setForm({ ...form, tentative_month: '' });
                  }
                }}
              />
              <label htmlFor="tentative" className="text-sm font-medium">Tanggal Tentative (belum pasti)</label>
            </div>
            {form.tentative_month ? (
              <div>
                <label className="text-sm text-muted-foreground">Bulan & Tahun (Tentative)</label>
                <Input type="month" value={form.tentative_month} onChange={(e) => setForm({ ...form, tentative_month: e.target.value })} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Tanggal Mulai</label>
                  <Input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Tanggal Selesai</label>
                  <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Lokasi" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              <Input placeholder="Jarak (mis: 350 km)" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Biaya Pendaftaran</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Sharing</label>
                  <Input type="number" placeholder="0" value={form.price_sharing} onChange={(e) => setForm({ ...form, price_sharing: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Single</label>
                  <Input type="number" placeholder="0" value={form.price_single} onChange={(e) => setForm({ ...form, price_single: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Couple</label>
                  <Input type="number" placeholder="0" value={form.price_couple} onChange={(e) => setForm({ ...form, price_couple: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <Input type="number" placeholder="Maks Peserta" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })} />
            <EventImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            <Input placeholder="Highlights (pisahkan koma)" value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} />
            <Input placeholder="Persyaratan (pisahkan koma)" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} />
            <Input placeholder="Include (pisahkan koma)" value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} />
            <Input placeholder="Exclude (pisahkan koma)" value={form.excludes} onChange={(e) => setForm({ ...form, excludes: e.target.value })} />
            
            {/* Asuransi */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <input type="checkbox" id="insurance" checked={form.insurance_enabled} onChange={(e) => setForm({ ...form, insurance_enabled: e.target.checked })} className="h-4 w-4 rounded border-input" />
              <label htmlFor="insurance" className="text-sm font-medium">Asuransi Tersedia</label>
            </div>
            {form.insurance_enabled && (
              <RichTextEditor value={form.insurance_description} onChange={(v) => setForm({ ...form, insurance_description: v })} placeholder="Deskripsi asuransi (jenis, cakupan, dll)" minHeight="80px" />
            )}

            {/* Towing */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <input type="checkbox" id="towing" checked={form.towing_enabled} onChange={(e) => setForm({ ...form, towing_enabled: e.target.checked })} className="h-4 w-4 rounded border-input" />
              <label htmlFor="towing" className="text-sm font-medium">Towing Motor Tersedia</label>
            </div>
            {form.towing_enabled && (
              <div className="space-y-3">
                <RichTextEditor value={form.towing_description} onChange={(v) => setForm({ ...form, towing_description: v })} placeholder="Deskripsi towing (jenis layanan, rute, dll)" minHeight="80px" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Harga Towing Pergi</label>
                    <Input type="number" placeholder="0" value={form.towing_pergi_price} onChange={(e) => setForm({ ...form, towing_pergi_price: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Harga Towing Pulang</label>
                    <Input type="number" placeholder="0" value={form.towing_pulang_price} onChange={(e) => setForm({ ...form, towing_pulang_price: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
            )}

            {/* Smart Touring Finder Fields */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">🔎 Smart Touring Finder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Rider Level</label>
                    <Select value={form.rider_level} onValueChange={(v) => setForm({ ...form, rider_level: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(RIDER_LEVELS).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Style Touring</label>
                    <Select value={form.touring_style} onValueChange={(v) => setForm({ ...form, touring_style: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TOURING_STYLES).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipe Motor yang Cocok</label>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(MOTOR_TYPES).map(([key, val]) => (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.motor_types.includes(key)}
                          onCheckedChange={(checked) => {
                            setForm({
                              ...form,
                              motor_types: checked
                                ? [...form.motor_types, key]
                                : form.motor_types.filter(t => t !== key),
                            });
                          }}
                        />
                        {val.icon} {val.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Jam Riding / Hari</label>
                    <Input type="number" step="0.5" min="0" max="24" placeholder="0" value={form.riding_hours_per_day} onChange={(e) => setForm({ ...form, riding_hours_per_day: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Tingkat Capek: {FATIGUE_LABELS[form.fatigue_level]}</label>
                    <Slider
                      min={1} max={5} step={1}
                      value={[form.fatigue_level]}
                      onValueChange={(v) => setForm({ ...form, fatigue_level: v[0] })}
                      className="mt-3"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Ringan</span><span>Berat</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="upcoming">Akan Datang</SelectItem>
                <SelectItem value="ongoing">Berlangsung</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
              </SelectContent>
            </Select>

            {/* Itinerary Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" /> Itinerary Perhari
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addItineraryDay}><Plus className="h-3 w-3 mr-1" /> Tambah Hari</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {itineraries.map((it, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Hari {it.day_number}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItinerary(i)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={it.date} onChange={(e) => updateItinerary(i, 'date', e.target.value)} placeholder="Tanggal" />
                      <Input value={it.title} onChange={(e) => updateItinerary(i, 'title', e.target.value)} placeholder="Judul hari ini" />
                    </div>
                    <RichTextEditor value={it.description} onChange={(v) => updateItinerary(i, 'description', v)} placeholder="Deskripsi kegiatan hari ini..." minHeight="100px" />
                  </div>
                ))}
                {!itineraries.length && <p className="text-sm text-muted-foreground text-center py-2">Belum ada itinerary.</p>}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => saveMutation.mutate('draft')}
                disabled={saveMutation.isPending || !form.title}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                💾 Simpan Draft
              </Button>
              <Button
                className="flex-1"
                onClick={() => saveMutation.mutate(form.status === 'draft' ? 'upcoming' : undefined)}
                disabled={saveMutation.isPending || !form.title || (!form.date && !form.tentative_month)}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editId ? 'Simpan & Publikasi' : 'Tambah & Publikasi'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {participantsEvent && (
        <AdminEventParticipants
          eventId={participantsEvent.id}
          eventTitle={participantsEvent.title}
          open={!!participantsEvent}
          onOpenChange={(o) => { if (!o) setParticipantsEvent(null); }}
        />
      )}
      {interestsEvent && (
        <AdminEventInterests
          eventId={interestsEvent.id}
          eventTitle={interestsEvent.title}
          open={!!interestsEvent}
          onOpenChange={(o) => { if (!o) setInterestsEvent(null); }}
        />
      )}
    </AdminLayout>
  );
}
