import { useState, useEffect } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, X } from 'lucide-react';
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
}

interface ImageItem {
  image_url: string;
  caption: string;
}

const EMPTY_FORM: JournalForm = { title: '', slug: '', content: '', event_id: '', status: 'draft' };

export default function AdminTripJournals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<JournalForm>(EMPTY_FORM);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');

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

  // Load existing images & participants when editing
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title,
        slug: form.slug,
        content: form.content,
        event_id: form.event_id || null,
        status: form.status,
        author_id: user!.id,
        published_at: form.status === 'published' ? new Date().toISOString() : null,
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

      // Save images
      await supabase.from('trip_journal_images').delete().eq('journal_id', journalId!);
      if (images.length > 0) {
        const imgRows = images.map((img, i) => ({
          journal_id: journalId!,
          image_url: img.image_url,
          caption: img.caption,
          sort_order: i,
        }));
        await supabase.from('trip_journal_images').insert(imgRows);
      }

      // Save participants
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
    setForm({ title: j.title, slug: j.slug, content: j.content, event_id: j.event_id || '', status: j.status });
    setOpen(true);
  };

  const handleTitleChange = (newTitle: string) => {
    const autoSlug = !editId || form.slug === generateSlug(form.title);
    setForm({ ...form, title: newTitle, ...(autoSlug ? { slug: generateSlug(newTitle) } : {}) });
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const filteredProfiles = (allProfiles || []).filter(p =>
    p.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Jurnal Trip</h1>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Buat Jurnal</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {(journals || []).map((j) => (
            <Card key={j.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{j.title}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(j.created_at), 'dd MMM yyyy')}</div>
                </div>
                <Badge variant={j.status === 'published' ? 'default' : 'secondary'}>{j.status === 'published' ? 'Published' : 'Draft'}</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(j)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Hapus jurnal ini?')) deleteMutation.mutate(j.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(journals || []).length === 0 && <p className="text-center text-muted-foreground py-8">Belum ada jurnal.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Jurnal' : 'Buat Jurnal Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              <RichTextEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} placeholder="Tulis jurnal trip..." minHeight="250px" />
            </div>

            <MultiImageUpload value={images} onChange={setImages} bucket="journal-images" />

            {/* Participant selector */}
            <div className="space-y-2">
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
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title.trim()}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editId ? 'Simpan Perubahan' : 'Buat Jurnal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
