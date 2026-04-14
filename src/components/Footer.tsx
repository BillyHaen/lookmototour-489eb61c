import { Instagram, Youtube, MessageCircle } from "lucide-react";
import RichTextContent from "@/components/RichTextContent";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FooterSettings {
  description: string;
  instagram_url: string;
  youtube_url: string;
  whatsapp_number: string;
  address: string;
  phone: string;
  email: string;
}

const defaults: FooterSettings = {
  description:
    "#1 Moto Touring Organizer Indonesia. Jelajahi keindahan nusantara bersama kami melalui event touring, adventure, dan workshop yang seru dan aman.",
  instagram_url: "",
  youtube_url: "",
  whatsapp_number: "6281234567890",
  address: "Jakarta, Indonesia",
  phone: "+62 812-3456-7890",
  email: "info@lookmototour.com",
};

export default function Footer() {
  const { data: settings } = useQuery({
    queryKey: ["site-settings", "footer"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("value").eq("key", "footer").single();
      if (error) return defaults;
      return data.value as unknown as FooterSettings;
    },
    staleTime: 5 * 60 * 1000,
  });

  const s = settings || defaults;

  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl mb-4">
              <img src={logo} alt="LookMotoTour" className="h-8 w-auto" />
            </Link>
            <RichTextContent content={s.description} className="text-muted-foreground text-sm max-w-md" />
            <div className="flex gap-3 mt-4">
              {s.instagram_url && (
                <a
                  href={s.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {s.youtube_url && (
                <a
                  href={s.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              )}
              {s.whatsapp_number && (
                <a
                  href={`https://wa.me/${s.whatsapp_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary transition-colors"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">Menu</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-foreground transition-colors">
                  Event
                </Link>
              </li>
              <li>
                <Link to="/calendar" className="hover:text-foreground transition-colors">
                  Kalender
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  Tentang Kami
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-3">Kontak</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {s.address && <li>📍 {s.address}</li>}
              {s.phone && <li>📞 {s.phone}</li>}
              {s.email && <li>✉️ {s.email}</li>}
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
