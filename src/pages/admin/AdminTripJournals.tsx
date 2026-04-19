import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/RichTextEditor';
import MultiImageUpload from '@/components/MultiImageUpload';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import UserAvatar from '@/components/UserAvatar';

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

interface JournalForm {
  title: string;
  slug: string;
  content: string;
  event_id: string;
  status: string;
  scheduled_at: string;
}

interface ImageItem {
  image_url: string;
  caption: string;
}

const EMPTY_FORM: JournalForm = { title: '', slug: '', content: '', event_id: '', status: 'draft', scheduled_at: '' };

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusBadge(j: any) {
  if (j.status === 'published') return <Badge variant="default">Published</Badge>;
  if (j.scheduled_at && new Date(j.scheduled_at) > new Date()) return <Badge variant="secondary">Terjadwal</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

export default function AdminTripJournals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<JournalForm>(EMPTY_FORM);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');

  const { data: journals, isLoading } = useQuery({
    queryKey: ['admin-trip-journals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trip_journals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ['events-for-journal'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('id, title').is('deleted_at', null).order('date', { ascending: false });
      return data || [];
    },
  });

  const { data: allProfiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, name, avatar_url');
      return data || [];
    },
  });

  useEffect(() => {
    if (editId && open) {
      supabase.from('trip_journal_images').select('*').eq('journal_id', editId).order('sort_order').then(({ data }) => {
        setImages((data || []).map(d => ({ image_url: d.image_url, caption: d.caption || '' })));
      });
      supabase.from('trip_journal_participants').select('user_id').eq('journal_id', editId).then(({ data }) => {
        setSelectedParticipants((data || []).map(d => d.user_id));
      });
    }
  }, [editId, open]);

  const filteredJournals = useMemo(() => {
    return (journals || []).filter((j: any) => {
      if (filterSearch && !j.title.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      if (filterStatus === 'draft' && (j.status !== 'draft' || (j.scheduled_at && new Date(j.scheduled_at) > new Date()))) return false;
      if (filterStatus === 'scheduled' && !(j.status === 'draft' && j.scheduled_at && new Date(j.scheduled_at) > new Date())) return false;
      if (filterStatus === 'published' && j.status !== 'published') return false;
      const ref = new Date(j.published_at || j.created_at).getTime();
      if (filterFrom && ref < new Date(filterFrom).getTime()) return false;
      if (filterTo && ref > new Date(filterTo).getTime() + 86400000) return false;
      return true;
    });
  }, [journals, filterSearch, filterStatus, filterFrom, filterTo]);

  const resetFilters = () => { setFilterSearch(''); setFilterStatus('all'); setFilterFrom(''); setFilterTo(''); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let effectiveStatus = form.status;
      let publishedAt: string | null = null;
      let scheduledAt: string | null = null;
      if (form.status === 'published') publishedAt = new Date().toISOString();
      else if (form.status === 'scheduled' && form.scheduled_at) {
        effectiveStatus = 'draft';
        scheduledAt = new Date(form.scheduled_at).toISOString();
      }

      const payload: any = {
        title: form.title,
        slug: form.slug,
        content: form.content,
        event_id: form.event_id || null,
        status: effectiveStatus,
        author_id: user!.id,
        published_at: publishedAt,
        scheduled_at: scheduledAt,
      };

      let journalId = editId;
      if (editId) {
        const { error } = await supabase.from('trip_journals').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('trip_journals').insert(payload).select('id').single();
        if (error) throw error;
        journalId = data.id;
      }

      await supabase.from('trip_journal_images').delete().eq('journal_id', journalId!);
      if (images.length > 0) {
        const imgRows = images.map((img, i) => ({
          journal_id: journalId!, image_url: img.image_url, caption: img.caption, sort_order: i,
        }));
        await supabase.from('trip_journal_images').insert(imgRows);
      }

      await supabase.from('trip_journal_participants').delete().eq('journal_id', journalId!);
      if (selectedParticipants.length > 0) {
        const partRows = selectedParticipants.map(uid => ({ journal_id: journalId!, user_id: uid }));
        await supabase.from('trip_journal_participants').insert(partRows);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trip-journals'] });
      toast({ title: editId ? 'Jurnal diperbarui ✅' : 'Jurnal dibuat ✅' });
      setOpen(false);
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trip_journals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trip-journals'] });
      toast({ title: 'Jurnal dihapus ✅' });
    },
  });

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setImages([]); setSelectedParticipants([]); setOpen(true); };
  const openEdit = (j: any) => {
    setEditId(j.id);
    const isScheduled = j.status === 'draft' && j.scheduled_at && new Date(j.scheduled_at) > new Date();
    setForm({
      title: j.title, slug: j.slug, content: j.content, event_id: j.event_id || '',
      status: isScheduled ? 'scheduled' : j.status,
      scheduled_at: toLocalInput(j.scheduled_at),
    });
    setOpen(true);
  };

  const handleTitleChange = (newTitle: string) => {
    const autoSlug = !editId || form.slug === generateSlug(form.title);
    setForm({ ...form, title: newTitle, ...(autoSlug ? { slug: generateSlug(newTitle) } : {}) });
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const filteredProfiles = (allProfiles || []).filter(p => p.name.toLowerCase().includes(userSearch.toLowerCase()));

  const previewJournal = () => {
    if (!form.slug) { toast({ title: 'Slug kosong, simpan dulu', variant: 'destructive' }); return; }
    window.open(`/jurnal/${form.slug}?preview=1`, '_blank');
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading font-bold text-2xl">Jurnal Trip</h1>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Buat Jurnal</Button>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="Cari judul..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} className="lg:col-span-2" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Terjadwal</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          <Button variant="outline" onClick={resetFilters} className="gap-2 lg:col-span-5 sm:col-span-2"><X className="h-4 w-4" /> Reset Filter</Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filteredJournals.map((j: any) => (
            <Card key={j.id}>
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{j.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(j.created_at), 'dd MMM yyyy')}
                    {j.scheduled_at && j.status === 'draft' && new Date(j.scheduled_at) > new Date() && (
                      <span className="ml-2">→ tayang {format(new Date(j.scheduled_at), 'dd MMM yyyy HH:mm')}</span>
                    )}
                  </div>
                </div>
                {statusBadge(j)}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(j)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Hapus jurnal ini?')) deleteMutation.mutate(j.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredJournals.length === 0 && <p className="text-center text-muted-foreground py-8">Tidak ada jurnal yang cocok dengan filter.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Jurnal' : 'Buat Jurnal Baru'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Konten</TabsTrigger>
              <TabsTrigger value="gallery">Galeri</TabsTrigger>
              <TabsTrigger value="participants">Peserta</TabsTrigger>
              <TabsTrigger value="publish">Publikasi</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Judul</label>
                <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Slug URL</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Event Terkait (Opsional)</label>
                <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih event..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada</SelectItem>
                    {(events || []).map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Konten</label>
                <RichTextEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} placeholder="Tulis jurnal trip..." minHeight="300px" />
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              <MultiImageUpload value={images} onChange={setImages} bucket="journal-images" />
            </TabsContent>

            <TabsContent value="participants" className="space-y-2 mt-4">
              <label className="text-sm font-medium">Peserta Trip</label>
              {selectedParticipants.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedParticipants.map(uid => {
                    const prof = (allProfiles || []).find(p => p.user_id === uid);
                    return (
                      <Badge key={uid} variant="secondary" className="gap-1 pr-1">
                        <UserAvatar src={prof?.avatar_url} name={prof?.name} className="h-4 w-4" />
                        {prof?.name || uid.slice(0, 8)}
                        <button onClick={() => toggleParticipant(uid)} className="ml-1 rounded-full hover:bg-muted p-0.5"><X className="h-3 w-3" /></button>
                      </Badge>
                    );
                  })}
                </div>
              )}
              <Input placeholder="Cari user..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              {userSearch && (
                <div className="max-h-40 overflow-y-auto border border-border rounded-md divide-y divide-border">
                  {filteredProfiles.slice(0, 20).map(p => (
                    <button key={p.user_id} type="button" className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left ${selectedParticipants.includes(p.user_id) ? 'bg-primary/10' : ''}`} onClick={() => toggleParticipant(p.user_id)}>
                      <UserAvatar src={p.avatar_url} name={p.name} className="h-6 w-6" />
                      {p.name}
                      {selectedParticipants.includes(p.user_id) && <span className="ml-auto text-xs text-primary">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="publish" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Terjadwal</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status === 'scheduled' && (
                <div>
                  <label className="text-sm font-medium">Tayang pada</label>
                  <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={previewJournal} className="gap-2"><Eye className="h-4 w-4" /> Preview</Button>
            <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title.trim() || (form.status === 'scheduled' && !form.scheduled_at)}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editId ? 'Simpan Perubahan' : 'Buat Jurnal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
