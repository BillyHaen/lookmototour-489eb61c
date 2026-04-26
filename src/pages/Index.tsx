import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Map, Users, Star, CalendarDays, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import TestimonialSection from "@/components/TestimonialSection";
import { useEvents } from "@/hooks/useEvents";
import { useBlogPosts } from "@/hooks/useBlog";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const FEATURES = [
  { icon: Map, title: "Rute Terbaik", desc: "Rute touring yang sudah disurvey dan aman untuk semua level rider." },
  { icon: Shield, title: "Keamanan", desc: "Tim support, P3K, dan asuransi perjalanan di setiap event." },
  { icon: Users, title: "Komunitas", desc: "Bergabung dengan ratusan rider dari seluruh Indonesia." },
  { icon: Star, title: "Pengalaman", desc: "Dokumentasi profesional dan merchandise eksklusif." },
];

export default function Index() {
  const { data: events, isLoading } = useEvents();
  const { data: blogPosts, isLoading: blogLoading } = useBlogPosts();
  const { data: interestCounts } = useQuery({
    queryKey: ["event-interest-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_event_interest_counts");
      if (error) return {};
      const map: Record<string, number> = {};
      (data as any[])?.forEach((r: any) => {
        map[r.event_id] = Number(r.interest_count);
      });
      return map;
    },
  });
  const upcomingEvents = (events || []).filter((e) => e.status === "upcoming").slice(0, 3);
  const latestPosts = (blogPosts || []).slice(0, 3);

  useSeoMeta({
    title: "LookMotoTour - Jelajahi Indonesia & Dunia di Atas Motor",
    description: "#1 Moto Touring Organizer Indonesia. Event touring, adventure, workshop untuk penghobi motor.",
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-3">Kenapa LookMotoTour?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Kami menyediakan pengalaman touring motor terbaik dengan standar keamanan tinggi.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl bg-card shadow-card border border-border text-center group hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Trip Match CTA */}
      <section className="py-12 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg">Bingung pilih touring?</h3>
                <p className="text-sm text-muted-foreground">
                  Jawab 4 pertanyaan, AI kami carikan trip terbaik untukmu!
                </p>
              </div>
            </div>
            <Button asChild className="gap-2 whitespace-nowrap">
              <Link to="/trip-match">
                <Sparkles className="h-4 w-4" /> Find My Ride
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-2">Event Mendatang</h2>
              <p className="text-muted-foreground">Jangan sampai ketinggalan event seru kami!</p>
            </div>
            <Button variant="outline" className="hidden sm:flex gap-2" asChild>
              <Link to="/events">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} interestCount={interestCounts?.[event.id]} />
              ))}
            </div>
          )}
          <div className="sm:hidden mt-6 text-center">
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/events">
                Lihat Semua Event <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-2">Blog Terbaru</h2>
              <p className="text-muted-foreground">Tips touring, berita komunitas, dan cerita inspiratif.</p>
            </div>
            <Button variant="outline" className="hidden sm:flex gap-2" asChild>
              <Link to="/blog">
                Lihat Semua <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {blogLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug || post.id}`} className="group">
                  <div className="rounded-xl overflow-hidden border border-border bg-card shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
                    {post.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <CalendarDays className="h-3 w-3" />
                        {post.published_at
                          ? format(new Date(post.published_at), "dd MMM yyyy")
                          : format(new Date(post.created_at), "dd MMM yyyy")}
                      </div>
                      <h3 className="font-heading font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Belum ada artikel.</p>
          )}
          <div className="sm:hidden mt-6 text-center">
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/blog">
                Lihat Semua Artikel <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialSection />

      {/* CTA */}
      <section className="py-20 bg-gradient-dark text-center">
        <div className="container max-w-2xl">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4" style={{ color: "hsl(0 0% 100%)" }}>
            Siap Untuk Petualangan?
          </h2>
          <p className="text-lg mb-8" style={{ color: "hsl(0 0% 75%)" }}>
            Daftar sekarang dan jadilah bagian dari komunitas touring motor terbesar di Indonesia.
          </p>
          <Button size="lg" className="text-base font-semibold gap-2" asChild>
            <Link to="/events">
              Mulai Sekarang <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
