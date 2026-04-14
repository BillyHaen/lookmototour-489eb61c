import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import RichTextContent from '@/components/RichTextContent';
import Footer from "@/components/Footer";
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/data/events";
import { Loader2, ShoppingBag, MessageCircle, Search } from "lucide-react";
import eventPlaceholder from "@/assets/event-placeholder.jpg";

const CATEGORIES = ["semua", "aksesoris", "apparel", "sparepart", "merchandise", "lainnya"];

export default function Shop() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("semua");

  const { data: products, isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("products") as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = (products || []).filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "semua" || p.category === category;
    return matchSearch && matchCat;
  });

  const getWhatsAppLink = (product: any) => {
    const msg = `Halo, saya ingin memesan:\n\n*${product.name}*\nHarga: ${formatPrice(product.price)}\n\nMohon info ketersediaan dan cara pembayaran. Terima kasih!`;
    return `https://wa.me/628996053877?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container">
          <div className="text-center mb-10">
            <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2 flex items-center justify-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" /> Toko LookMotoTour
            </h1>
            <p className="text-muted-foreground">Perlengkapan touring dan merchandise eksklusif</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c === "semua" ? "Semua Kategori" : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((p: any) => (
                <div
                  key={p.id}
                  className="rounded-xl bg-card shadow-card border border-border overflow-hidden group hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={p.image_url || eventPlaceholder}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <Badge variant="secondary" className="mb-2 capitalize">
                        {p.category}
                      </Badge>
                      <h3 className="font-heading font-semibold text-lg">{p.name}</h3>
                      <RichTextContent content={p.description} className="text-sm text-muted-foreground line-clamp-2" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xl text-primary">{formatPrice(p.price)}</p>
                      <span className="text-xs text-muted-foreground">Stok: {p.stock}</span>
                    </div>
                    <Button className="w-full gap-2" asChild disabled={p.stock <= 0}>
                      <a href={getWhatsAppLink(p)} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-4 w-4" /> {p.stock > 0 ? "Beli via WhatsApp" : "Stok Habis"}
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isLoading && !filtered.length && (
            <p className="text-muted-foreground text-center py-12">Belum ada produk tersedia.</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
