import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, FileText, Film, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMediaLibrary, useUploadMedia, MediaType, MediaItem } from '@/hooks/useMedia';
import { toast } from '@/hooks/use-toast';

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
  filterType?: MediaType | 'all';
  title?: string;
}

const TYPE_ICONS: Record<MediaType, JSX.Element> = {
  image: <ImageIcon className="h-4 w-4" />,
  video: <Film className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
};

export default function MediaPickerDialog({ open, onOpenChange, onSelect, filterType = 'all', title = 'Pilih Media' }: MediaPickerDialogProps) {
  const { user } = useAuth();
  const [type, setType] = useState<MediaType | 'all'>(filterType);
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: items, isLoading } = useMediaLibrary(type, search);
  const upload = useUploadMedia();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !user) return;
    let last: MediaItem | null = null;
    for (const f of Array.from(files)) {
      try {
        last = await upload.mutateAsync({ file: f, userId: user.id });
      } catch {/* toast handled */}
    }
    if (fileRef.current) fileRef.current.value = '';
    if (last) {
      toast({ title: `${files.length} file diunggah ✅` });
      // Auto-select last uploaded if single
      if (files.length === 1) onSelect(last);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="self-start">
            <TabsTrigger value="library">Pustaka Media</TabsTrigger>
            <TabsTrigger value="upload">Upload Baru</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 overflow-hidden flex flex-col gap-3 mt-3">
            <div className="flex gap-2">
              <Input placeholder="Cari nama file..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {filterType === 'all' && (
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="image">Gambar</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="document">Dokumen</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (items || []).length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-12">Belum ada media. Upload di tab "Upload Baru".</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(items || []).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { onSelect(item); onOpenChange(false); }}
                      className="group text-left rounded-lg border border-border hover:border-primary overflow-hidden transition-colors bg-card"
                    >
                      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                        {item.file_type === 'image' ? (
                          <img src={item.file_url} alt={item.file_name} className="w-full h-full object-cover" />
                        ) : item.file_type === 'video' ? (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground"><Film className="h-10 w-10" /><span className="text-xs">Video</span></div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground"><FileText className="h-10 w-10" /><span className="text-xs">Dokumen</span></div>
                        )}
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-medium truncate flex items-center gap-1">
                          {TYPE_ICONS[item.file_type]}
                          <span className="truncate">{item.file_name}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-3">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Upload gambar, video, atau dokumen.</p>
              <Button type="button" disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
                {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Pilih File
              </Button>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
