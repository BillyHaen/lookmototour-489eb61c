import { useRef, useState } from 'react';
import AdminLayout from './AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Loader2, Upload, FileText, Film, Image as ImageIcon, Trash2, Copy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMediaLibrary, useUploadMedia, useDeleteMedia, MediaType } from '@/hooks/useMedia';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AdminMedia() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<MediaType | 'all'>('all');
  const [search, setSearch] = useState('');
  const { data: items, isLoading } = useMediaLibrary(type, search);
  const upload = useUploadMedia();
  const del = useDeleteMedia();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !user) return;
    let ok = 0;
    for (const f of Array.from(files)) {
      try { await upload.mutateAsync({ file: f, userId: user.id }); ok++; } catch {/* handled */}
    }
    if (fileRef.current) fileRef.current.value = '';
    if (ok) toast({ title: `${ok} file diunggah ✅` });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'URL disalin ✅' });
  };

  const fmtSize = (b: number | null) => {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-heading font-bold text-2xl">Pustaka Media</h1>
        <Button className="gap-2" disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
          {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload File
        </Button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <Input placeholder="Cari nama file..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="image">Gambar</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="document">Dokumen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (items || []).length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Belum ada file. Upload pertama kamu di atas.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(items || []).map(item => (
            <Card key={item.id} className="overflow-hidden group">
              <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                {item.file_type === 'image' ? (
                  <img src={item.file_url} alt={item.file_name} className="w-full h-full object-cover" />
                ) : item.file_type === 'video' ? (
                  <Film className="h-12 w-12 text-muted-foreground" />
                ) : (
                  <FileText className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="p-3 space-y-1">
                <div className="text-xs font-medium truncate" title={item.file_name}>{item.file_name}</div>
                <div className="text-[10px] text-muted-foreground flex justify-between">
                  <span>{fmtSize(item.size_bytes)}</span>
                  <span>{format(new Date(item.created_at), 'dd/MM/yy')}</span>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 h-7 px-2" onClick={() => copyUrl(item.file_url)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => { if (confirm('Hapus file ini?')) del.mutate(item); }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
