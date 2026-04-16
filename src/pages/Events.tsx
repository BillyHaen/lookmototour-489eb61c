import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, Loader2, X, ChevronDown, Sparkles, Shield } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCard from '@/components/EventCard';
import { EVENT_CATEGORIES, EventCategory, RIDER_LEVELS, MOTOR_TYPES, TOURING_STYLES, calculateSafetyScore, SAFETY_LEVEL_LABELS, SafetyLevel } from '@/data/events';
import { useEvents } from '@/hooks/useEvents';
import { useSeoMeta } from '@/hooks/useSeoMeta';
import { supabase } from '@/integrations/supabase/client';

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'upcoming', label: 'Akan Datang' },
  { value: 'ongoing', label: 'Berlangsung' },
  { value: 'completed', label: 'Selesai' },
];

const DIFFICULTY_FILTERS = [
  { value: 'all', label: 'Semua Tingkat' },
  { value: 'mudah', label: 'Mudah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'sulit', label: 'Sulit' },
];

export default function Events() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [riderLevelFilter, setRiderLevelFilter] = useState('all');
  const [motorTypeFilter, setMotorTypeFilter] = useState('all');
  const [touringStyleFilter, setTouringStyleFilter] = useState('all');
  const [safetyFilter, setSafetyFilter] = useState<SafetyLevel | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');
  const { data: events, isLoading } = useEvents();

  useSeoMeta({
    title: 'Event Touring Motor Indonesia | LookMotoTour',
    description: 'Temukan event touring, adventure, dan workshop motor terbaik di Indonesia. Filter berdasarkan kategori, level, dan gaya touring.',
  });

  const { data: interestCounts } = useQuery({
    queryKey: ['event-interest-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_event_interest_counts');
      if (error) return {};
      const map: Record<string, number> = {};
      (data as any[])?.forEach((r: any) => { map[r.event_id] = Number(r.interest_count); });
      return map;
    },
  });

  const activeFilterCount = [statusFilter, difficultyFilter, riderLevelFilter, motorTypeFilter, touringStyleFilter, safetyFilter]
    .filter((f) => f !== 'all').length;

  const clearAllFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setDifficultyFilter('all');
    setRiderLevelFilter('all');
    setMotorTypeFilter('all');
    setTouringStyleFilter('all');
    setSafetyFilter('all');
  };

  const filtered = useMemo(() => {
    let result = [...(events || [])];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') result = result.filter((e) => e.category === categoryFilter);
    if (statusFilter !== 'all') result = result.filter((e) => e.status === statusFilter);
    if (difficultyFilter !== 'all') result = result.filter((e) => e.difficulty === difficultyFilter);
    if (riderLevelFilter !== 'all') result = result.filter((e) => (e as any).rider_level === riderLevelFilter || (e as any).rider_level === 'all');
    if (motorTypeFilter !== 'all') result = result.filter((e) => ((e as any).motor_types || []).includes(motorTypeFilter));
    if (touringStyleFilter !== 'all') result = result.filter((e) => (e as any).touring_style === touringStyleFilter);
    if (safetyFilter !== 'all') {
      result = result.filter((e) => {
        const s = calculateSafetyScore({ road_condition: (e as any).road_condition, difficulty: e.difficulty, fatigue_level: (e as any).fatigue_level, distance: e.distance });
        return s.level === safetyFilter;
      });
    }
    result.sort((a, b) => sortBy === 'date' ? new Date(a.date).getTime() - new Date(b.date).getTime() : a.price - b.price);
    return result;
  }, [events, search, categoryFilter, statusFilter, difficultyFilter, riderLevelFilter, motorTypeFilter, touringStyleFilter, safetyFilter, sortBy]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2">Semua Event</h1>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-muted-foreground">Temukan event touring, adventure, dan workshop yang sesuai untukmu.</p>
              <Link to="/trip-match">
                <Button className="gap-2 whitespace-nowrap">
                  <Sparkles className="h-4 w-4" /> Find My Ride
                </Button>
              </Link>
            </div>
          </div>

          {/* Compact Filter Bar */}
          <div className="space-y-3 mb-8">
            {/* Row 1: Search + Sort + Advanced Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari event atau lokasi..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10" />
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'price')}>
                <SelectTrigger className="w-[130px] h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Tanggal</SelectItem>
                  <SelectItem value="price">Harga</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10 gap-1.5 relative">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="hidden sm:inline">Filter</span>
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4 space-y-4" align="end">
                  <div className="flex items-center justify-between">
                    <p className="font-heading font-semibold text-sm">Filter Lanjutan</p>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => { setStatusFilter('all'); setDifficultyFilter('all'); setRiderLevelFilter('all'); setMotorTypeFilter('all'); setTouringStyleFilter('all'); }}>
                        Reset
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_FILTERS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tingkat Kesulitan</label>
                      <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_FILTERS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Level Rider</label>
                      <Select value={riderLevelFilter} onValueChange={setRiderLevelFilter}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Level</SelectItem>
                          {Object.entries(RIDER_LEVELS).filter(([k]) => k !== 'all').map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tipe Motor</label>
                      <Select value={motorTypeFilter} onValueChange={setMotorTypeFilter}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Motor</SelectItem>
                          {Object.entries(MOTOR_TYPES).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Style Touring</label>
                      <Select value={touringStyleFilter} onValueChange={setTouringStyleFilter}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Style</SelectItem>
                          {Object.entries(TOURING_STYLES).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Row 2: Category pills (compact, scrollable on mobile) */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <Badge
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer shrink-0 text-xs"
                onClick={() => setCategoryFilter('all')}
              >
                Semua
              </Badge>
              {Object.entries(EVENT_CATEGORIES).map(([key, cat]) => (
                <Badge
                  key={key}
                  variant={categoryFilter === key ? 'default' : 'outline'}
                  className="cursor-pointer shrink-0 text-xs"
                  onClick={() => setCategoryFilter(key as EventCategory)}
                >
                  {cat.icon} {cat.label}
                </Badge>
              ))}
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-muted-foreground mr-1">Filter aktif:</span>
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setStatusFilter('all')}>
                    {STATUS_FILTERS.find((s) => s.value === statusFilter)?.label} <X className="h-3 w-3" />
                  </Badge>
                )}
                {difficultyFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setDifficultyFilter('all')}>
                    {DIFFICULTY_FILTERS.find((d) => d.value === difficultyFilter)?.label} <X className="h-3 w-3" />
                  </Badge>
                )}
                {riderLevelFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setRiderLevelFilter('all')}>
                    {RIDER_LEVELS[riderLevelFilter as keyof typeof RIDER_LEVELS]?.label} <X className="h-3 w-3" />
                  </Badge>
                )}
                {motorTypeFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setMotorTypeFilter('all')}>
                    {MOTOR_TYPES[motorTypeFilter as keyof typeof MOTOR_TYPES]?.label} <X className="h-3 w-3" />
                  </Badge>
                )}
                {touringStyleFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setTouringStyleFilter('all')}>
                    {TOURING_STYLES[touringStyleFilter as keyof typeof TOURING_STYLES]?.label} <X className="h-3 w-3" />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground px-2" onClick={clearAllFilters}>
                  Hapus semua
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Tidak ada event yang ditemukan.</p>
              <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                Reset Filter
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{filtered.length} event ditemukan</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((event) => (
                  <EventCard key={event.id} event={event} interestCount={interestCounts?.[event.id]} />
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
