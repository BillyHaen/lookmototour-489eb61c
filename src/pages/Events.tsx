import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCard from '@/components/EventCard';
import { EVENT_CATEGORIES, EventCategory } from '@/data/events';
import { useEvents } from '@/hooks/useEvents';

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'upcoming', label: 'Akan Datang' },
  { value: 'ongoing', label: 'Berlangsung' },
  { value: 'completed', label: 'Selesai' },
];

export default function Events() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');
  const { data: events, isLoading } = useEvents();

  const filtered = useMemo(() => {
    let result = [...(events || [])];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') result = result.filter((e) => e.category === categoryFilter);
    if (statusFilter !== 'all') result = result.filter((e) => e.status === statusFilter);
    result.sort((a, b) => sortBy === 'date' ? new Date(a.date).getTime() - new Date(b.date).getTime() : a.price - b.price);
    return result;
  }, [events, search, categoryFilter, statusFilter, sortBy]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">Semua Event</h1>
            <p className="text-muted-foreground">Temukan event touring, adventure, dan workshop yang sesuai untukmu.</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari event atau lokasi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Button variant={sortBy === 'date' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('date')}>
                  <SlidersHorizontal className="h-4 w-4 mr-1" /> Tanggal
                </Button>
                <Button variant={sortBy === 'price' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('price')}>
                  Harga
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={categoryFilter === 'all' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCategoryFilter('all')}>
                Semua Kategori
              </Badge>
              {Object.entries(EVENT_CATEGORIES).map(([key, cat]) => (
                <Badge key={key} variant={categoryFilter === key ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setCategoryFilter(key as EventCategory)}>
                  {cat.icon} {cat.label}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => (
                <Badge key={s.value} variant={statusFilter === s.value ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setStatusFilter(s.value)}>
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Tidak ada event yang ditemukan.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all'); }}>
                Reset Filter
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{filtered.length} event ditemukan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
