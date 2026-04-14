import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  Users,
  MapPin,
  Map,
  Star,
  Shield,
  Zap,
  Award,
  Globe,
  Compass,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useHeroSettings } from "@/hooks/useHeroSettings";
import heroBgFallback from "@/assets/hero-bg.jpg";

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  MapPin,
  Calendar,
  Map,
  Star,
  Shield,
  Zap,
  Award,
  Globe,
  Compass,
};

export default function HeroSection() {
  const { data: hero } = useHeroSettings();
  const scrollRef = useRef<HTMLDivElement>(null);

  const images = hero?.images?.length
    ? hero.images
    : [{ url: heroBgFallback, alt: "Motorcycle touring di pegunungan Indonesia" }];
  const stats = hero?.stats?.length
    ? hero.stats
    : [
        { icon: "Users", label: "Riders", value: "500+" },
        { icon: "MapPin", label: "Rute", value: "50+" },
        { icon: "Calendar", label: "Event/tahun", value: "12+" },
      ];
  const isMulti = images.length > 1;

  const scroll = (dir: number) => {
    if (!scrollRef.current) return;
    const w = scrollRef.current.offsetWidth;
    scrollRef.current.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background images */}
      {isMulti ? (
        <div
          ref={scrollRef}
          className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((img, i) => (
            <div key={i} className="min-w-full h-full snap-start flex-shrink-0 relative">
              <img
                src={img.url}
                alt={img.alt || `Hero banner ${i + 1}`}
                className="w-full h-full object-cover"
                width={1920}
                height={1080}
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      ) : (
        <img
          src={images[0].url}
          alt={images[0].alt || "Motorcycle touring di pegunungan Indonesia"}
          className="absolute inset-0 w-full h-full object-cover"
          width={1920}
          height={1080}
        />
      )}

      <div className="absolute inset-0 bg-gradient-hero" />

      {/* Scroll arrows */}
      {isMulti && (
        <>
          <button
            onClick={() => scroll(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity hover:opacity-100 opacity-60"
            style={{ backgroundColor: "hsla(0 0% 0% / 0.4)", color: "hsl(0 0% 100%)" }}
            aria-label="Slide sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-opacity hover:opacity-100 opacity-60"
            style={{ backgroundColor: "hsla(0 0% 0% / 0.4)", color: "hsl(0 0% 100%)" }}
            aria-label="Slide berikutnya"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div className="container relative z-10 py-20 md:py-32">
        <div className="max-w-2xl animate-fade-in-up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6 backdrop-blur-sm border border-primary/30">
            🏍️ #1 Moto Touring Organizer Indonesia
          </span>
          <h1
            className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-tight mb-6"
            style={{ color: "hsl(0 0% 100%)" }}
          >
            Jelajahi Indonesia dan Dunia
            <br />
            <span className="text-gradient">di Atas Motor</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-lg" style={{ color: "hsl(0 0% 85%)" }}>
            Bergabung bersama platform touring motor terbesar. Event seru, rute menantang, dan pengalaman tak
            terlupakan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="text-base font-semibold gap-2" asChild>
              <Link to="/events">
                Lihat Event <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base font-semibold border-2"
              style={{
                borderColor: "hsl(0 0% 80%)",
                color: "hsl(0 0% 100%)",
                backgroundColor: "hsla(0 0% 100% / 0.1)",
              }}
              asChild
            >
              <Link to="/calendar">
                <Calendar className="h-5 w-5 mr-2" /> Kalender Event
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg">
          {stats.map((stat) => {
            const IconComp = ICON_MAP[stat.icon] || Users;
            return (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl backdrop-blur-sm"
                style={{ backgroundColor: "hsla(0 0% 100% / 0.1)", border: "1px solid hsla(0 0% 100% / 0.15)" }}
              >
                <IconComp className="h-5 w-5 mx-auto mb-1" style={{ color: "hsl(25 95% 53%)" }} />
                <div className="font-heading font-bold text-xl" style={{ color: "hsl(0 0% 100%)" }}>
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: "hsl(0 0% 70%)" }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
