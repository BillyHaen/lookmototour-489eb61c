import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShoppingBag, Search } from "lucide-react";

const CATEGORIES = ["semua", "aksesoris", "apparel", "sparepart", "merchandise", "lainnya"];
const MODES = [
  { value: 'all', label: 'Semua' },
  { value: 'buy', label: 'Beli' },
  { value: 'rent', label: 'Sewa' },
];

export default function Shop() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("semua");
  const [mode, setMode] = useState("all");

  useSeoMeta({
    title: 'Shop - Sewa & Beli Gear Touring | LookMotoTour',
    description: 'Sewa atau beli gear touring motor: helm, jaket, luggage, aksesoris. Try first, buy later di LookMotoTour.',
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("products") as any)
        .select("*, vendors(name, logo_url)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = (products || []).filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "semua" || p.category === category;
    const matchMode = mode === 'all' ||
      (mode === 'rent' && p.is_rentable) ||
      (mode === 'buy' && p.is_purchasable);
    return matchSearch && matchCat && matchMode;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container">
          <div className="text-center mb-10">
            <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2 flex items-center justify-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" /> Toko LookMotoTour
            </h1>
            <p className="text-muted-foreground">Sewa atau beli gear touring — Try First, Buy Later</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c === "semua" ? "Semua Kategori" : c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-border p-1 bg-muted/30 max-w-sm mb-8">
            {MODES.map(m => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex-1 text-sm py-2 rounded transition-colors ${mode === m.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((p: any) => <ProductCard key={p.id} product={p} />)}
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
