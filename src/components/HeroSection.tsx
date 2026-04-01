import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Users, MapPin } from 'lucide-react';
import heroBg from '@/assets/hero-bg.jpg';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <img
        src={heroBg}
        alt="Motorcycle touring di pegunungan Indonesia"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      
      <div className="container relative z-10 py-20 md:py-32">
        <div className="max-w-2xl animate-fade-in-up">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6 backdrop-blur-sm border border-primary/30">
            🏍️ #1 Moto Tour Community
          </span>
          <h1 className="font-heading font-extrabold text-4xl md:text-6xl lg:text-7xl leading-tight mb-6" style={{ color: 'hsl(0 0% 100%)' }}>
            Jelajahi Indonesia
            <br />
            <span className="text-gradient">di Atas Motor</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-lg" style={{ color: 'hsl(0 0% 85%)' }}>
            Bergabung bersama komunitas touring motor terbesar. Event seru, rute menantang, dan pengalaman tak terlupakan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="text-base font-semibold gap-2" asChild>
              <Link to="/events">
                Lihat Event <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base font-semibold border-2" style={{ borderColor: 'hsl(0 0% 80%)', color: 'hsl(0 0% 100%)', backgroundColor: 'hsla(0 0% 100% / 0.1)' }} asChild>
              <Link to="/calendar">
                <Calendar className="h-5 w-5 mr-2" /> Kalender Event
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-4 max-w-lg">
          {[
            { icon: Users, label: 'Riders', value: '500+' },
            { icon: MapPin, label: 'Rute', value: '50+' },
            { icon: Calendar, label: 'Event/tahun', value: '30+' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 rounded-xl backdrop-blur-sm" style={{ backgroundColor: 'hsla(0 0% 100% / 0.1)', border: '1px solid hsla(0 0% 100% / 0.15)' }}>
              <stat.icon className="h-5 w-5 mx-auto mb-1" style={{ color: 'hsl(25 95% 53%)' }} />
              <div className="font-heading font-bold text-xl" style={{ color: 'hsl(0 0% 100%)' }}>{stat.value}</div>
              <div className="text-xs" style={{ color: 'hsl(0 0% 70%)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
