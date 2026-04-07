import { Shield, Map, Users, Heart } from 'lucide-react';
import logo from '@/assets/logo.png';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container max-w-3xl">
           <h1 className="font-heading font-bold text-3xl md:text-4xl mb-6 flex items-center gap-3">
            <img src={logo} alt="LookMotoTour" className="h-10 w-auto" /> Tentang LookMotoTour
          </h1>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <p className="text-lg text-muted-foreground">
              LookMotoTour adalah komunitas touring motor yang berbasis di Indonesia. Kami menghubungkan para penghobi touring motor dari seluruh nusantara melalui event-event yang seru, aman, dan penuh petualangan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
              {[
                { icon: Heart, title: 'Passion', desc: 'Didirikan oleh para rider yang mencintai petualangan di atas motor.' },
                { icon: Shield, title: 'Keamanan', desc: 'Setiap event dilengkapi dengan tim support, P3K, dan asuransi.' },
                { icon: Map, title: 'Rute Terbaik', desc: '50+ rute yang sudah disurvey dan aman untuk semua level.' },
                { icon: Users, title: 'Komunitas', desc: '500+ rider aktif dari berbagai kota di Indonesia.' },
              ].map((v) => (
                <div key={v.title} className="p-5 rounded-xl bg-card shadow-card border border-border">
                  <v.icon className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-heading font-semibold mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="font-heading font-bold text-2xl mt-8">Misi Kami</h2>
            <p className="text-muted-foreground">
              Menjadi platform touring motor terdepan di Indonesia yang menyediakan pengalaman jelajah nusantara yang aman, menyenangkan, dan tak terlupakan bagi setiap rider.
            </p>

            <h2 className="font-heading font-bold text-2xl">Kontak</h2>
            <ul className="text-muted-foreground space-y-1">
              <li>📍 Jakarta, Indonesia</li>
              <li>📞 +62 812-3456-7890</li>
              <li>✉️ info@lookmototour.com</li>
              <li>🌐 Instagram: @lookmototour</li>
            </ul>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
