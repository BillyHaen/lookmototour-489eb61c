export type EventCategory = 'touring' | 'adventure' | 'race' | 'gathering' | 'workshop' | 'motocamp';

export interface MotoEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // ISO date
  endDate?: string;
  location: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  image?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  highlights: string[];
  difficulty: 'mudah' | 'sedang' | 'sulit';
  distance: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  motorType: string;
  plateNumber: string;
  emergencyContact: string;
  notes?: string;
  createdAt: string;
}

export const RIDER_LEVELS = {
  all: { label: 'Semua Level', icon: '👥' },
  beginner: { label: 'Beginner', icon: '🟢' },
  intermediate: { label: 'Intermediate', icon: '🟡' },
  hardcore: { label: 'Hardcore', icon: '🔴' },
} as const;

export const MOTOR_TYPES = {
  sport: { label: 'Sport', icon: '🏎️' },
  adv: { label: 'ADV', icon: '🏔️' },
  cruiser: { label: 'Cruiser', icon: '🛣️' },
  matic: { label: 'Matic', icon: '🛵' },
  bebek: { label: 'Bebek', icon: '🏍️' },
} as const;

export const TOURING_STYLES = {
  santai: { label: 'Santai (Coffee Ride)', icon: '☕' },
  adventure: { label: 'Adventure', icon: '⛰️' },
  luxury: { label: 'Luxury Touring', icon: '💎' },
  spiritual: { label: 'Spiritual Touring', icon: '🕌' },
} as const;

export const FATIGUE_LABELS: Record<number, string> = {
  1: 'Sangat Ringan',
  2: 'Ringan',
  3: 'Sedang',
  4: 'Berat',
  5: 'Sangat Berat',
};

export const ROAD_CONDITION_LABELS: Record<number, string> = {
  1: 'Aspal Mulus',
  2: 'Aspal Biasa',
  3: 'Aspal Rusak Ringan',
  4: 'Off-road',
  5: 'Extreme Trail',
};

export type SafetyLevel = 'aman' | 'waspada' | 'hardcore';

export interface SafetyScoreResult {
  score: number;
  level: SafetyLevel;
  color: string;
  breakdown: {
    roadCondition: number;
    difficulty: number;
    fatigue: number;
    distance: number;
  };
  tips: string[];
}

export function calculateSafetyScore(event: {
  road_condition?: number;
  difficulty: string;
  fatigue_level?: number;
  distance?: string | null;
}): SafetyScoreResult {
  const road = event.road_condition ?? 3;
  const difficultyMap: Record<string, number> = { mudah: 1, sedang: 2, sulit: 3 };
  const diff = difficultyMap[event.difficulty] ?? 2;
  const fatigue = event.fatigue_level ?? 1;

  // Parse distance
  const distNum = parseFloat((event.distance || '0').replace(/[^0-9.]/g, '')) || 0;
  const distPenalty = distNum < 100 ? 0 : distNum <= 300 ? 1 : distNum <= 500 ? 2 : 3;

  // Weighted penalties (max penalty = 3 + 2.5 + 2.5 + 2 = 10)
  const penalty =
    (road / 5) * 3 +
    (diff / 3) * 2.5 +
    (fatigue / 5) * 2.5 +
    (distPenalty / 3) * 2;

  const raw = Math.max(1, Math.min(10, 10 - penalty));
  const score = Math.round(raw * 10) / 10;

  const level: SafetyLevel = score >= 7 ? 'aman' : score >= 4 ? 'waspada' : 'hardcore';
  const color = score >= 7 ? 'hsl(142 71% 45%)' : score >= 4 ? 'hsl(40 100% 50%)' : 'hsl(0 84% 60%)';

  const tips: string[] = [];
  if (road >= 4) tips.push('Pastikan ban off-road dan ground clearance memadai');
  if (road >= 3) tips.push('Perhatikan kondisi jalan, kurangi kecepatan di area rusak');
  if (fatigue >= 4) tips.push('Sediakan waktu istirahat yang cukup, bawa perbekalan ekstra');
  if (distNum > 300) tips.push('Jarak jauh — cek kondisi motor sebelum berangkat');
  if (diff >= 3) tips.push('Hanya untuk rider berpengalaman');
  if (score >= 7) tips.push('Cocok untuk semua level rider');

  return {
    score,
    level,
    color,
    breakdown: {
      roadCondition: road,
      difficulty: diff,
      fatigue,
      distance: distPenalty,
    },
    tips,
  };
}

export const SAFETY_LEVEL_LABELS: Record<SafetyLevel, { label: string; icon: string }> = {
  aman: { label: 'Aman', icon: '✅' },
  waspada: { label: 'Waspada', icon: '⚠️' },
  hardcore: { label: 'Hardcore', icon: '🔴' },
};

export type RiderLevel = keyof typeof RIDER_LEVELS;
export type MotorType = keyof typeof MOTOR_TYPES;
export type TouringStyle = keyof typeof TOURING_STYLES;

export const EVENT_CATEGORIES: Record<EventCategory, { label: string; color: string; icon: string }> = {
  touring: { label: 'Touring', color: 'bg-primary', icon: '🏍️' },
  adventure: { label: 'Adventure', color: 'bg-accent', icon: '🏔️' },
  race: { label: 'Race', color: 'bg-destructive', icon: '🏁' },
  gathering: { label: 'Gathering', color: 'bg-secondary', icon: '🤝' },
  workshop: { label: 'Workshop', color: 'bg-muted', icon: '🔧' },
  motocamp: { label: 'Motocamp', color: 'bg-accent', icon: '🏕️' },
};

export const SAMPLE_EVENTS: MotoEvent[] = [
  {
    id: '1',
    title: 'Touring Bromo Sunrise',
    description: 'Nikmati pengalaman touring ke Gunung Bromo dengan pemandangan sunrise yang spektakuler. Rute akan melewati jalur pegunungan yang indah dan menantang.',
    category: 'touring',
    date: '2026-04-15',
    endDate: '2026-04-17',
    location: 'Malang - Bromo, Jawa Timur',
    price: 750000,
    maxParticipants: 30,
    currentParticipants: 18,
    status: 'upcoming',
    highlights: ['Sunrise di Bromo', 'Jalur pegunungan', 'Camp fire malam', 'Dokumentasi drone'],
    difficulty: 'sedang',
    distance: '350 km',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-20T00:00:00Z',
  },
  {
    id: '2',
    title: 'Adventure Trail Sukabumi',
    description: 'Petualangan off-road melintasi trail Sukabumi yang menantang. Cocok untuk rider yang mencari adrenalin dan tantangan.',
    category: 'adventure',
    date: '2026-04-25',
    location: 'Sukabumi, Jawa Barat',
    price: 500000,
    maxParticipants: 20,
    currentParticipants: 12,
    status: 'upcoming',
    highlights: ['Trail off-road', 'River crossing', 'Makan siang lokal', 'Sertifikat'],
    difficulty: 'sulit',
    distance: '120 km',
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-15T00:00:00Z',
  },
  {
    id: '3',
    title: 'Sunday Morning Ride Jakarta',
    description: 'Ride santai Minggu pagi menyusuri jalanan Jakarta yang sepi. Meet & greet sesama riders.',
    category: 'gathering',
    date: '2026-04-06',
    location: 'Monas, Jakarta Pusat',
    price: 0,
    maxParticipants: 50,
    currentParticipants: 35,
    status: 'upcoming',
    highlights: ['Ride santai', 'Sarapan bersama', 'Foto bersama', 'Free sticker'],
    difficulty: 'mudah',
    distance: '40 km',
    createdAt: '2026-03-10T00:00:00Z',
    updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: '4',
    title: 'Workshop Basic Maintenance',
    description: 'Belajar perawatan dasar motor bersama mekanik profesional. Cocok untuk pemula.',
    category: 'workshop',
    date: '2026-03-20',
    location: 'Bengkel LookMoto, Bandung',
    price: 200000,
    maxParticipants: 15,
    currentParticipants: 15,
    status: 'completed',
    highlights: ['Ganti oli', 'Cek rem', 'Setel rantai', 'Toolkit gratis'],
    difficulty: 'mudah',
    distance: '0 km',
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-03-20T00:00:00Z',
  },
  {
    id: '5',
    title: 'Trans Java Ride 2026',
    description: 'Ekspedisi epic dari Jakarta ke Bali! 7 hari perjalanan melewati kota-kota indah di Pulau Jawa.',
    category: 'touring',
    date: '2026-05-10',
    endDate: '2026-05-17',
    location: 'Jakarta - Bali',
    price: 3500000,
    maxParticipants: 25,
    currentParticipants: 8,
    status: 'upcoming',
    highlights: ['7 hari touring', 'Hotel bintang 3', 'Support car', 'Dokumentasi profesional', 'Jersey eksklusif'],
    difficulty: 'sedang',
    distance: '1200 km',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-25T00:00:00Z',
  },
  {
    id: '6',
    title: 'Cornering Workshop Sentul',
    description: 'Tingkatkan skill cornering kamu bersama instruktur bersertifikat di Sentul International Circuit.',
    category: 'workshop',
    date: '2026-04-01',
    location: 'Sentul International Circuit, Bogor',
    price: 1500000,
    maxParticipants: 20,
    currentParticipants: 20,
    status: 'ongoing',
    highlights: ['Track day', 'Instruktur pro', 'Video analisis', 'Makan siang'],
    difficulty: 'sedang',
    distance: '0 km',
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
];

export function getEventStatus(event: MotoEvent): 'upcoming' | 'ongoing' | 'completed' {
  const now = new Date();
  const start = new Date(event.date);
  const end = event.endDate ? new Date(event.endDate) : start;
  if (now < start) return 'upcoming';
  if (now > end) return 'completed';
  return 'ongoing';
}

export function formatPrice(price: number): string {
  const value = Number.isFinite(price) ? price : 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function formatTentativeMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}
