import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Search, BarChart3, Sparkles } from 'lucide-react';
import SponsorEditor from '@/components/admin/SponsorEditor';
import SponsorPerformance from '@/components/admin/SponsorPerformance';
import SponsorAIControlPanel from '@/components/admin/SponsorAIControlPanel';

const CATEGORIES = ['dealer', 'gear', 'accessories', 'apparel', 'service', 'other'];

export default function AdminSponsors() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editing, setEditing] = useState<any | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [perfFor, setPerfFor] = useState<any | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const { data: sponsors, isLoading } = useQuery({
    queryKey: ['admin-sponsors'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('sponsors' as any) as any)
        .select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('sponsors' as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Sponsor dihapus' });
      qc.invalidateQueries({ queryKey: ['admin-sponsors'] });
    },
    onError: (e: any) => toast({ title: 'Gagal hapus', description: e.message, variant: 'destructive' }),
  });

  const filtered = (sponsors || []).filter((s) => {
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Sponsor Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAiOpen(true)}>
            <Sparkles className="h-4 w-4 mr-1" /> AI Settings
          </Button>
          <Button onClick={() => { setEditing(null); setEditorOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Sponsor
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari nama sponsor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="md:w-48"><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Card key={s.id} className="hover:shadow-elevated transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {s.logo_url ? <img src={s.logo_url} alt={s.name} className="max-h-12 max-w-12 object-contain" /> : <span className="font-bold">{s.name[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{s.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{s.category}</Badge>
                      <Badge variant={s.status === 'active' ? 'default' : 'secondary'} className="text-xs">{s.status}</Badge>
                    </div>
                  </div>
                </div>
                {s.tagline && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{s.tagline}</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing(s); setEditorOpen(true); }}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPerfFor(s)} title="Performa">
                    <BarChart3 className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { if (confirm(`Hapus sponsor "${s.name}"?`)) deleteMut.mutate(s.id); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">Belum ada sponsor.</p>}
        </div>
      )}

      <SponsorEditor open={editorOpen} onOpenChange={setEditorOpen} sponsor={editing} />
      <SponsorPerformance sponsor={perfFor} onClose={() => setPerfFor(null)} />
      <SponsorAIControlPanel open={aiOpen} onOpenChange={setAiOpen} />
    </AdminLayout>
  );
}
