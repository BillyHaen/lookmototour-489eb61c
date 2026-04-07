import { Instagram, Youtube, MessageCircle } from 'lucide-react';
import logo from '@/assets/logo.png';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl mb-4">
              <Mountain className="h-7 w-7 text-primary" />
              <span>LookMotoTour</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              Komunitas touring motor terpercaya di Indonesia. Jelajahi keindahan nusantara bersama kami melalui event touring, adventure, dan workshop yang seru dan aman.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors" aria-label="YouTube">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors" aria-label="WhatsApp">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">Menu</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Beranda</Link></li>
              <li><Link to="/events" className="hover:text-foreground transition-colors">Event</Link></li>
              <li><Link to="/calendar" className="hover:text-foreground transition-colors">Kalender</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">Tentang Kami</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">Kontak</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>📍 Jakarta, Indonesia</li>
              <li>📞 +62 812-3456-7890</li>
              <li>✉️ info@lookmototour.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} LookMotoTour. Semua hak dilindungi.
        </div>
      </div>
    </footer>
  );
}
