import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface FooterSettings {
  description: string;
  instagram_url: string;
  youtube_url: string;
  whatsapp_number: string;
  address: string;
  phone: string;
  email: string;
}

const defaultFooter: FooterSettings = {
  description: '',
  instagram_url: '',
  youtube_url: '',
  whatsapp_number: '',
  address: '',
  phone: '',
  email: '',
};

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [footer, setFooter] = useState<FooterSettings>(defaultFooter);

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings', 'footer'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'footer')
        .single();
      if (error) throw error;
      return data.value as unknown as FooterSettings;
    },
  });

  useEffect(() => {
    if (data) setFooter(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: footer as any, updated_at: new Date().toISOString() })
        .eq('key', 'footer');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Pengaturan disimpan ✅' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Pengaturan Situs</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Deskripsi</label>
            <Textarea
              value={footer.description}
              onChange={(e) => setFooter({ ...footer, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">URL Instagram</label>
              <Input
                placeholder="https://instagram.com/..."
                value={footer.instagram_url}
                onChange={(e) => setFooter({ ...footer, instagram_url: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">URL YouTube</label>
              <Input
                placeholder="https://youtube.com/..."
                value={footer.youtube_url}
                onChange={(e) => setFooter({ ...footer, youtube_url: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Nomor WhatsApp</label>
            <Input
              placeholder="6281234567890"
              value={footer.whatsapp_number}
              onChange={(e) => setFooter({ ...footer, whatsapp_number: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">Format tanpa + atau spasi, contoh: 6281234567890</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Alamat</label>
            <Input
              placeholder="Jakarta, Indonesia"
              value={footer.address}
              onChange={(e) => setFooter({ ...footer, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Telepon</label>
              <Input
                placeholder="+62 812-3456-7890"
                value={footer.phone}
                onChange={(e) => setFooter({ ...footer, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                placeholder="info@lookmototour.com"
                value={footer.email}
                onChange={(e) => setFooter({ ...footer, email: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
