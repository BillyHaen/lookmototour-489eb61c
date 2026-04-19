import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import CategoryTagManager from '@/components/admin/CategoryTagManager';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { syncPostCategories, syncPostTags, usePostCategories, usePostTags, useCategories, useTags } from '@/hooks/useBlogTaxonomy';

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

interface PostForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url: string;
  status: string; // draft | scheduled | published
  scheduled_at: string; // ISO string for input[type=datetime-local]
}

interface GalleryItem { image_url: string; caption: string; }

const EMPTY_FORM: PostForm = { title: '', slug: '', content: '', excerpt: '', image_url: '', status: 'draft', scheduled_at: '' };

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusBadge(p: any) {
  if (p.status === 'published') return <Badge variant="default">Published</Badge>;
  if (p.scheduled_at && new Date(p.scheduled_at) > new Date()) return <Badge variant="secondary">Terjadwal</Badge>;
  return <Badge variant="outline">Draft</Badge>;
}

export default function AdminBlog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: postCatLinks } = useQuery({
    queryKey: ['all-post-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('blog_post_categories').select('*');
      return data || [];
    },
  });
  const { data: postTagLinks } = useQuery({
    queryKey: ['all-post-tags'],
    queryFn: async () => {
      const { data } = await supabase.from('blog_post_tags').select('*');
      return data || [];
    },
  });

  const { data: categories } = useCategories();
  const { data: tags } = useTags();
  const { data: editPostCats } = usePostCategories(editId);
  const { data: editPostTags } = usePostTags(editId);

  useEffect(() => { if (editPostCats) setSelectedCats(editPostCats); }, [editPostCats]);
  useEffect(() => { if (editPostTags) setSelectedTags(editPostTags); }, [editPostTags]);

  const filteredPosts = useMemo(() => {
    return (posts || []).filter((p: any) => {
      if (filterSearch && !p.title.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      if (filterStatus === 'draft' && (p.status !== 'draft' || (p.scheduled_at && new Date(p.scheduled_at) > new Date()))) return false;
      if (filterStatus === 'scheduled' && !(p.status === 'draft' && p.scheduled_at && new Date(p.scheduled_at) > new Date())) return false;
      if (filterStatus === 'published' && p.status !== 'published') return false;
      const ref = new Date(p.published_at || p.created_at).getTime();
      if (filterFrom && ref < new Date(filterFrom).getTime()) return false;
      if (filterTo && ref > new Date(filterTo).getTime() + 86400000) return false;
      if (filterCat !== 'all' && !(postCatLinks || []).some((l: any) => l.post_id === p.id && l.category_id === filterCat)) return false;
      if (filterTag !== 'all' && !(postTagLinks || []).some((l: any) => l.post_id === p.id && l.tag_id === filterTag)) return false;
      return true;
    });
  }, [posts, filterSearch, filterStatus, filterFrom, filterTo, filterCat, filterTag, postCatLinks, postTagLinks]);

  const resetFilters = () => {
    setFilterSearch(''); setFilterStatus('all'); setFilterFrom(''); setFilterTo(''); setFilterCat('all'); setFilterTag('all');
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Determine effective status
      let effectiveStatus = form.status;
      let publishedAt: string | null = null;
      let scheduledAt: string | null = null;
      if (form.status === 'published') {
        publishedAt = new Date().toISOString();
      } else if (form.status === 'scheduled' && form.scheduled_at) {
        effectiveStatus = 'draft';
        scheduledAt = new Date(form.scheduled_at).toISOString();
      }

      const payload: any = {
        title: form.title,
        slug: form.slug,
        content: form.content,
        excerpt: form.excerpt,
        image_url: form.image_url,
        status: effectiveStatus,
        published_at: publishedAt,
        scheduled_at: scheduledAt,
        gallery,
        author_id: user!.id,
      };

      let postId = editId;
      if (editId) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('blog_posts').insert(payload).select('id').single();
        if (error) throw error;
        postId = data.id;
      }

      await syncPostCategories(postId!, selectedCats);
      await syncPostTags(postId!, selectedTags);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['all-post-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-post-tags'] });
      toast({ title: editId ? 'Post diperbarui ✅' : 'Post dibuat ✅' });
      setOpen(false);
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({ title: 'Post dihapus ✅' });
    },
  });

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setGallery([]);
    setSelectedCats([]);
    setSelectedTags([]);
    setOpen(true);
  };
  const openEdit = (p: any) => {
    setEditId(p.id);
    const isScheduled = p.status === 'draft' && p.scheduled_at && new Date(p.scheduled_at) > new Date();
    setForm({
      title: p.title,
      slug: p.slug,
      content: p.content,
      excerpt: p.excerpt,
      image_url: p.image_url || '',
      status: isScheduled ? 'scheduled' : p.status,
      scheduled_at: toLocalInput(p.scheduled_at),
    });
    setGallery(Array.isArray(p.gallery) ? p.gallery : []);
    setOpen(true);
  };

  const handleTitleChange = (newTitle: string) => {
    const autoSlug = !editId || form.slug === generateSlug(form.title);
    setForm({ ...form, title: newTitle, ...(autoSlug ? { slug: generateSlug(newTitle) } : {}) });
  };

  const previewPost = () => {
    if (!form.slug) { toast({ title: 'Slug kosong, simpan dulu', variant: 'destructive' }); return; }
    window.open(`/blog/${form.slug}?preview=1`, '_blank');
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading font-bold text-2xl">Blog</h1>
        <Button className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Buat Post</Button>
      </div>

      {/* Filter bar */}
      <Card className="mb-4">
        <CardContent className="p-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
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
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger><SelectValue placeholder="Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {(categories || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger><SelectValue placeholder="Tag" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tag</SelectItem>
              {(tags || []).map(t => <SelectItem key={t.id} value={t.id}>#{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={resetFilters} className="gap-2"><X className="h-4 w-4" /> Reset</Button>
          <div className="flex gap-2 lg:col-span-3">
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} placeholder="Dari" />
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} placeholder="Sampai" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                {p.image_url && <img src={p.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(p.created_at), 'dd MMM yyyy')}
                    {p.scheduled_at && p.status === 'draft' && new Date(p.scheduled_at) > new Date() && (
                      <span className="ml-2">→ tayang {format(new Date(p.scheduled_at), 'dd MMM yyyy HH:mm')}</span>
                    )}
                  </div>
                </div>
                {statusBadge(p)}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm('Hapus post ini?')) deleteMutation.mutate(p.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredPosts.length === 0 && <p className="text-center text-muted-foreground py-8">Tidak ada post yang cocok dengan filter.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Post' : 'Buat Post Baru'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">Konten</TabsTrigger>
              <TabsTrigger value="gallery">Galeri</TabsTrigger>
              <TabsTrigger value="taxonomy">Kategori & Tag</TabsTrigger>
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
                <label className="text-sm font-medium">Kutipan / Excerpt</label>
                <Input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Ringkasan singkat..." />
              </div>
              <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} bucket="blog-images" label="Gambar Cover" />
              <div>
                <label className="text-sm font-medium">Konten</label>
                <RichTextEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} placeholder="Tulis artikel..." minHeight="300px" />
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              <p className="text-xs text-muted-foreground mb-3">Foto-foto ini akan tampil sebagai slider di atas artikel. Tambahkan caption opsional per gambar.</p>
              <MultiImageUpload value={gallery} onChange={setGallery} bucket="blog-images" />
            </TabsContent>

            <TabsContent value="taxonomy" className="mt-4">
              <CategoryTagManager
                selectedCategories={selectedCats}
                selectedTags={selectedTags}
                onCategoriesChange={setSelectedCats}
                onTagsChange={setSelectedTags}
              />
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
                  <p className="text-xs text-muted-foreground mt-1">Sistem akan otomatis publish pada waktu tersebut.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={previewPost} className="gap-2"><Eye className="h-4 w-4" /> Preview</Button>
            <Button className="flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title.trim() || (form.status === 'scheduled' && !form.scheduled_at)}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editId ? 'Simpan Perubahan' : 'Buat Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
