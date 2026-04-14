import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { EVENT_CATEGORIES, formatPrice, EventCategory } from '@/data/events';
import { useEvents, DbEvent } from '@/hooks/useEvents';
import { getHolidaysForMonth } from '@/data/indonesianHolidays';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: events, isLoading } = useEvents();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const holidays = useMemo(() => getHolidaysForMonth(year, month), [year, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, DbEvent[]> = {};
    (events || []).forEach((event) => {
      const start = new Date(event.date);
      const end = event.end_date ? new Date(event.end_date) : start;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        if (!map[key]) map[key] = [];
        map[key].push(event);
      }
    });
    return map;
  }, [events]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); };

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const selectedHolidays = selectedDate ? (holidays[selectedDate] || []) : [];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl md:text-4xl mb-2 flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-primary" /> Kalender Event
            </h1>
            <p className="text-muted-foreground">Lihat jadwal event touring, adventure, dan workshop kami.</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="h-5 w-5" /></Button>
                  <h2 className="font-heading font-bold text-lg">{MONTHS[month]} {year}</h2>
                  <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="h-5 w-5" /></Button>
                </div>
                <div className="grid grid-cols-7 border-b border-border">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-3">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square border-b border-r border-border" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayEvents = eventsByDate[dateStr] || [];
                    const dayHolidays = holidays[dateStr] || [];
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const isSelected = selectedDate === dateStr;
                    const isSunday = new Date(year, month, day).getDay() === 0;
                    const hasLibur = dayHolidays.some(h => h.type === 'libur');
                    const hasCuti = dayHolidays.some(h => h.type === 'cuti');
                    const isHoliday = dayHolidays.length > 0;

                    return (
                      <button key={day} onClick={() => setSelectedDate(dateStr)}
                        className={`aspect-square border-b border-r border-border p-1 text-left transition-colors hover:bg-muted relative ${
                          isSelected ? 'bg-primary/10 ring-2 ring-primary ring-inset' : ''
                        } ${hasLibur ? 'bg-destructive/5' : hasCuti ? 'bg-orange-500/5' : ''} ${isToday ? 'font-bold' : ''}`}>
                        <span className={`text-xs md:text-sm ${
                          isToday
                            ? 'bg-primary text-primary-foreground w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center'
                            : (isHoliday || isSunday) ? 'text-destructive font-semibold' : ''
                        }`}>
                          {day}
                        </span>
                        {isHoliday && (
                          <span className={`hidden md:block text-[9px] leading-tight truncate mt-0.5 ${hasLibur ? 'text-destructive' : 'text-orange-500'}`}>
                            {dayHolidays[0].name}
                          </span>
                        )}
                          </span>
                        )}
                        <div className="absolute bottom-1 left-1 right-1 flex gap-0.5 justify-center">
                          {isHoliday && (
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                          )}
                          {dayEvents.slice(0, 2).map((e) => (
                            <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${
                              e.status === 'upcoming' ? 'bg-accent' : e.status === 'ongoing' ? 'bg-primary' : 'bg-muted-foreground'
                            }`} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Hari Libur</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> Akan Datang</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Berlangsung</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground" /> Selesai</span>
              </div>

              {selectedDate && (
                <div className="mt-8 animate-fade-in-up">
                  <h3 className="font-heading font-semibold text-lg mb-4">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>

                  {selectedHolidays.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {selectedHolidays.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                          <span className="text-lg">🇮🇩</span>
                          <div>
                            <p className="font-semibold text-sm text-destructive">{h}</p>
                            <p className="text-xs text-muted-foreground">Hari Libur Nasional</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedEvents.length === 0 && selectedHolidays.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">Tidak ada event atau hari libur pada tanggal ini.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedEvents.map((event) => {
                        const cat = EVENT_CATEGORIES[event.category as EventCategory] || EVENT_CATEGORIES.touring;
                        return (
                          <Link key={event.id} to={`/events/${(event as any).slug || event.id}`}
                            className="flex items-center gap-4 p-4 rounded-xl bg-card shadow-card border border-border hover:shadow-elevated transition-all group">
                            <div className="text-2xl">{cat.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold group-hover:text-primary transition-colors truncate">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">{event.location}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-xs">{cat.label}</Badge>
                              <p className="text-sm font-bold text-primary mt-1">{formatPrice(event.price)}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
