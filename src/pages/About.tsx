import { Shield, Map, Users, Heart, Star, Zap, Target, Award, Globe, Compass, LucideIcon } from 'lucide-react';
import logo from '@/assets/logo.png';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, LucideIcon> = {
  Heart, Shield, Map, Users, Star, Zap, Target, Award, Globe, Compass,
};

interface ValueCard { icon: string; title: string; desc: string; }
interface AboutSettings {
  description: string;
  visi: string;
  misi: string;
  values: ValueCard[];
}
interface FooterSettings {
  address: string;
  phone: string;
  email: string;
  instagram_url: string;
}

const defaults: AboutSettings = {
  description: 'LookMotoTour adalah komunitas touring motor yang berbasis di Indonesia.',
  visi: '',
  misi: 'Menjadi platform touring motor terdepan di Indonesia.',
  values: [],
};

export default function About() {
  const { data: about } = useQuery({
    queryKey: ['site-settings', 'about'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'about').single();
      if (error) return defaults;
      return data.value as unknown as AboutSettings;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: footer } = useQuery({
    queryKey: ['site-settings', 'footer'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'footer').single();
      if (error) return null;
      return data.value as unknown as FooterSettings;
    },
    staleTime: 5 * 60 * 1000,
  });

  const s = about || defaults;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container max-w-3xl">
          <h1 className="font-heading font-bold text-3xl md:text-4xl mb-6 flex items-center gap-3">
            <img src={logo} alt="LookMotoTour" className="h-10 w-auto" /> Tentang LookMotoTour
          </h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-lg text-muted-foreground">{s.description}</p>

            {s.values.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
                {s.values.map((v) => {
                  const Icon = iconMap[v.icon] || Heart;
                  return (
                    <div key={v.title} className="p-5 rounded-xl bg-card shadow-card border border-border">
                      <Icon className="h-6 w-6 text-primary mb-3" />
                      <h3 className="font-heading font-semibold mb-1">{v.title}</h3>
                      <p className="text-sm text-muted-foreground">{v.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {s.visi && (
              <>
                <h2 className="font-heading font-bold text-2xl mt-8">Visi Kami</h2>
                <p className="text-muted-foreground">{s.visi}</p>
              </>
            )}

            {s.misi && (
              <>
                <h2 className="font-heading font-bold text-2xl">Misi Kami</h2>
                <p className="text-muted-foreground">{s.misi}</p>
              </>
            )}

            <h2 className="font-heading font-bold text-2xl">Kontak</h2>
            <ul className="text-muted-foreground space-y-1">
              <li>📍 {footer?.address || 'Jakarta, Indonesia'}</li>
              <li>📞 {footer?.phone || '+62 812-3456-7890'}</li>
              <li>✉️ {footer?.email || 'info@lookmototour.com'}</li>
              {footer?.instagram_url && <li>🌐 Instagram: <a href={footer.instagram_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{footer.instagram_url}</a></li>}
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
