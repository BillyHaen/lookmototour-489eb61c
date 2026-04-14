import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from './AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichTextEditor from '@/components/RichTextEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminHeroSettings from '@/components/admin/AdminHeroSettings';

interface HeroImage { url: string; alt: string; }
interface HeroStat { icon: string; label: string; value: string; }
interface HeroSettings { images: HeroImage[]; stats: HeroStat[]; }

interface FooterSettings {
  description: string;
  instagram_url: string;
  youtube_url: string;
  whatsapp_number: string;
  address: string;
  phone: string;
  email: string;
}

interface ValueCard {
  icon: string;
  title: string;
  desc: string;
}

interface AboutSettings {
  description: string;
  visi: string;
  misi: string;
  values: ValueCard[];
}

const defaultFooter: FooterSettings = {
  description: '', instagram_url: '', youtube_url: '', whatsapp_number: '',
  address: '', phone: '', email: '',
};

const defaultAbout: AboutSettings = {
  description: '', visi: '', misi: '', values: [],
};

const ICON_OPTIONS = ['Heart', 'Shield', 'Map', 'Users', 'Star', 'Zap', 'Target', 'Award', 'Globe', 'Compass'];

function useSiteSettings<T>(key: string, defaultValue: T) {
  const [form, setForm] = useState<T>(defaultValue);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['site-settings', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings').select('value').eq('key', key).single();
      if (error) throw error;
      return data.value as unknown as T;
    },
  });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (value: T) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: value as any, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Pengaturan disimpan ✅' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { form, setForm, isLoading, saveMutation };
}

export default function AdminSettings() {
  const footer = useSiteSettings<FooterSettings>('footer', defaultFooter);
  const about = useSiteSettings<AboutSettings>('about', defaultAbout);

  const isLoading = footer.isLoading || about.isLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  const addValueCard = () => {
    about.setForm({
      ...about.form,
      values: [...about.form.values, { icon: 'Heart', title: '', desc: '' }],
    });
  };

  const updateValueCard = (index: number, field: keyof ValueCard, value: string) => {
    const updated = [...about.form.values];
    updated[index] = { ...updated[index], [field]: value };
    about.setForm({ ...about.form, values: updated });
  };

  const removeValueCard = (index: number) => {
    about.setForm({ ...about.form, values: about.form.values.filter((_, i) => i !== index) });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Pengaturan Situs</h1>
      </div>

      <Tabs defaultValue="footer" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="footer">Footer</TabsTrigger>
          <TabsTrigger value="about">Halaman About</TabsTrigger>
        </TabsList>

        <TabsContent value="footer">
          <Card>
            <CardHeader><CardTitle className="text-lg">Footer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Deskripsi</label>
                <RichTextEditor value={footer.form.description} onChange={(v) => footer.setForm({ ...footer.form, description: v })} placeholder="Deskripsi footer..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">URL Instagram</label>
                  <Input placeholder="https://instagram.com/..." value={footer.form.instagram_url} onChange={(e) => footer.setForm({ ...footer.form, instagram_url: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">URL YouTube</label>
                  <Input placeholder="https://youtube.com/..." value={footer.form.youtube_url} onChange={(e) => footer.setForm({ ...footer.form, youtube_url: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Nomor WhatsApp</label>
                <Input placeholder="6281234567890" value={footer.form.whatsapp_number} onChange={(e) => footer.setForm({ ...footer.form, whatsapp_number: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">Format tanpa + atau spasi, contoh: 6281234567890</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Alamat</label>
                <Input placeholder="Jakarta, Indonesia" value={footer.form.address} onChange={(e) => footer.setForm({ ...footer.form, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Telepon</label>
                  <Input placeholder="+62 812-3456-7890" value={footer.form.phone} onChange={(e) => footer.setForm({ ...footer.form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input placeholder="info@lookmototour.com" value={footer.form.email} onChange={(e) => footer.setForm({ ...footer.form, email: e.target.value })} />
                </div>
              </div>
              <Button onClick={() => footer.saveMutation.mutate(footer.form)} disabled={footer.saveMutation.isPending} className="gap-2">
                {footer.saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Footer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader><CardTitle className="text-lg">Halaman About</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Deskripsi</label>
                <RichTextEditor value={about.form.description} onChange={(v) => about.setForm({ ...about.form, description: v })} placeholder="Deskripsi tentang kami..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Visi</label>
                <RichTextEditor value={about.form.visi} onChange={(v) => about.setForm({ ...about.form, visi: v })} placeholder="Visi organisasi..." minHeight="80px" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Misi</label>
                <RichTextEditor value={about.form.misi} onChange={(v) => about.setForm({ ...about.form, misi: v })} placeholder="Misi organisasi..." minHeight="80px" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Value Cards</label>
                  <Button type="button" variant="outline" size="sm" onClick={addValueCard} className="gap-1">
                    <Plus className="h-3 w-3" /> Tambah
                  </Button>
                </div>
                {about.form.values.map((v, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Card {i + 1}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeValueCard(i)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Icon</label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={v.icon}
                          onChange={(e) => updateValueCard(i, 'icon', e.target.value)}
                        >
                          {ICON_OPTIONS.map((ico) => (
                            <option key={ico} value={ico}>{ico}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Judul</label>
                        <Input value={v.title} onChange={(e) => updateValueCard(i, 'title', e.target.value)} placeholder="Judul" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Deskripsi</label>
                      <Input value={v.desc} onChange={(e) => updateValueCard(i, 'desc', e.target.value)} placeholder="Deskripsi singkat" />
                    </div>
                  </div>
                ))}
                {!about.form.values.length && <p className="text-sm text-muted-foreground text-center py-2">Belum ada value card.</p>}
              </div>

              <Button onClick={() => about.saveMutation.mutate(about.form)} disabled={about.saveMutation.isPending} className="gap-2">
                {about.saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan About
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
