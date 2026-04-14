// Hari libur nasional Indonesia (recurring & fixed for 2024-2027)
// Format: { month (0-indexed), day, name }
// Tanggal yang berubah tiap tahun (Islamic/Hindu/Buddhist) dicantumkan per tahun

interface Holiday {
  name: string;
  date: string; // YYYY-MM-DD
}

// Fixed holidays (sama setiap tahun)
const fixedHolidays = [
  { month: 0, day: 1, name: 'Tahun Baru Masehi' },
  { month: 4, day: 1, name: 'Hari Buruh Internasional' },
  { month: 5, day: 1, name: 'Hari Lahir Pancasila' },
  { month: 7, day: 17, name: 'Hari Kemerdekaan RI' },
  { month: 11, day: 25, name: 'Hari Natal' },
];

// Variable holidays per year (Islamic, Hindu, Buddhist, Chinese calendars)
const variableHolidays: Record<number, { month: number; day: number; name: string }[]> = {
  2024: [
    { month: 1, day: 8, name: 'Isra Miraj Nabi Muhammad SAW' },
    { month: 1, day: 10, name: 'Tahun Baru Imlek' },
    { month: 2, day: 11, name: 'Hari Raya Nyepi' },
    { month: 2, day: 28, name: 'Wafat Isa Al Masih' },
    { month: 2, day: 29, name: 'Hari Raya Idul Fitri' },
    { month: 3, day: 10, name: 'Hari Raya Idul Fitri' },
    { month: 3, day: 11, name: 'Hari Raya Idul Fitri' },
    { month: 4, day: 9, name: 'Kenaikan Isa Al Masih' },
    { month: 4, day: 23, name: 'Hari Raya Waisak' },
    { month: 5, day: 17, name: 'Hari Raya Idul Adha' },
    { month: 6, day: 7, name: 'Tahun Baru Islam' },
    { month: 8, day: 16, name: 'Maulid Nabi Muhammad SAW' },
  ],
  2025: [
    { month: 0, day: 27, name: 'Isra Miraj Nabi Muhammad SAW' },
    { month: 0, day: 29, name: 'Tahun Baru Imlek' },
    { month: 2, day: 29, name: 'Hari Raya Nyepi' },
    { month: 2, day: 30, name: 'Hari Raya Idul Fitri' },
    { month: 2, day: 31, name: 'Hari Raya Idul Fitri' },
    { month: 3, day: 18, name: 'Wafat Isa Al Masih' },
    { month: 4, day: 12, name: 'Hari Raya Waisak' },
    { month: 4, day: 29, name: 'Kenaikan Isa Al Masih' },
    { month: 5, day: 6, name: 'Hari Raya Idul Adha' },
    { month: 5, day: 27, name: 'Tahun Baru Islam' },
    { month: 8, day: 5, name: 'Maulid Nabi Muhammad SAW' },
  ],
  2026: [
    { month: 0, day: 17, name: 'Tahun Baru Imlek' },
    { month: 0, day: 17, name: 'Isra Miraj Nabi Muhammad SAW' },
    { month: 2, day: 19, name: 'Hari Raya Nyepi' },
    { month: 2, day: 20, name: 'Hari Raya Idul Fitri' },
    { month: 2, day: 21, name: 'Hari Raya Idul Fitri' },
    { month: 3, day: 3, name: 'Wafat Isa Al Masih' },
    { month: 4, day: 1, name: 'Hari Raya Waisak' },
    { month: 4, day: 14, name: 'Kenaikan Isa Al Masih' },
    { month: 4, day: 27, name: 'Hari Raya Idul Adha' },
    { month: 5, day: 17, name: 'Tahun Baru Islam' },
    { month: 7, day: 26, name: 'Maulid Nabi Muhammad SAW' },
  ],
  2027: [
    { month: 0, day: 6, name: 'Tahun Baru Imlek' },
    { month: 0, day: 6, name: 'Isra Miraj Nabi Muhammad SAW' },
    { month: 2, day: 9, name: 'Hari Raya Idul Fitri' },
    { month: 2, day: 10, name: 'Hari Raya Idul Fitri' },
    { month: 2, day: 26, name: 'Wafat Isa Al Masih' },
    { month: 3, day: 8, name: 'Hari Raya Nyepi' },
    { month: 4, day: 6, name: 'Kenaikan Isa Al Masih' },
    { month: 4, day: 16, name: 'Hari Raya Idul Adha' },
    { month: 4, day: 20, name: 'Hari Raya Waisak' },
    { month: 5, day: 6, name: 'Tahun Baru Islam' },
    { month: 7, day: 15, name: 'Maulid Nabi Muhammad SAW' },
  ],
};

// Cuti bersama pemerintah per tahun
const cutiBersama: Record<number, { month: number; day: number; name: string }[]> = {
  2024: [
    { month: 1, day: 9, name: 'Cuti Bersama Isra Miraj' },
    { month: 2, day: 12, name: 'Cuti Bersama Nyepi' },
    { month: 3, day: 8, name: 'Cuti Bersama Idul Fitri' },
    { month: 3, day: 9, name: 'Cuti Bersama Idul Fitri' },
    { month: 3, day: 12, name: 'Cuti Bersama Idul Fitri' },
    { month: 4, day: 10, name: 'Cuti Bersama Kenaikan Isa Al Masih' },
    { month: 4, day: 24, name: 'Cuti Bersama Waisak' },
    { month: 5, day: 18, name: 'Cuti Bersama Idul Adha' },
    { month: 11, day: 26, name: 'Cuti Bersama Natal' },
  ],
  2025: [
    { month: 0, day: 28, name: 'Cuti Bersama Isra Miraj' },
    { month: 0, day: 30, name: 'Cuti Bersama Imlek' },
    { month: 2, day: 28, name: 'Cuti Bersama Idul Fitri' },
    { month: 3, day: 1, name: 'Cuti Bersama Idul Fitri' },
    { month: 3, day: 2, name: 'Cuti Bersama Idul Fitri' },
    { month: 3, day: 3, name: 'Cuti Bersama Idul Fitri' },
    { month: 3, day: 4, name: 'Cuti Bersama Idul Fitri' },
    { month: 4, day: 30, name: 'Cuti Bersama Kenaikan Isa Al Masih' },
    { month: 11, day: 26, name: 'Cuti Bersama Natal' },
  ],
  2026: [
    { month: 2, day: 18, name: 'Cuti Bersama Idul Fitri' },
    { month: 2, day: 19, name: 'Cuti Bersama Idul Fitri' },
    { month: 2, day: 22, name: 'Cuti Bersama Idul Fitri' },
    { month: 2, day: 23, name: 'Cuti Bersama Idul Fitri' },
    { month: 4, day: 15, name: 'Cuti Bersama Kenaikan Isa Al Masih' },
    { month: 4, day: 28, name: 'Cuti Bersama Idul Adha' },
    { month: 7, day: 18, name: 'Cuti Bersama Kemerdekaan RI' },
    { month: 11, day: 24, name: 'Cuti Bersama Natal' },
  ],
  2027: [
    { month: 0, day: 7, name: 'Cuti Bersama Imlek' },
    { month: 2, day: 8, name: 'Cuti Bersama Idul Fitri' },
    { month: 2, day: 11, name: 'Cuti Bersama Idul Fitri' },
    { month: 2, day: 12, name: 'Cuti Bersama Idul Fitri' },
    { month: 3, day: 9, name: 'Cuti Bersama Nyepi' },
    { month: 4, day: 7, name: 'Cuti Bersama Kenaikan Isa Al Masih' },
    { month: 4, day: 17, name: 'Cuti Bersama Idul Adha' },
    { month: 11, day: 24, name: 'Cuti Bersama Natal' },
  ],
};

export type HolidayType = 'libur' | 'cuti';

export interface HolidayInfo {
  name: string;
  type: HolidayType;
}

export function getHolidaysForMonth(year: number, month: number): Record<string, HolidayInfo[]> {
  const result: Record<string, HolidayInfo[]> = {};

  const add = (m: number, d: number, name: string, type: HolidayType) => {
    if (m !== month) return;
    const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (!result[key]) result[key] = [];
    if (!result[key].some(h => h.name === name)) result[key].push({ name, type });
  };

  fixedHolidays.forEach((h) => add(h.month, h.day, h.name, 'libur'));
  (variableHolidays[year] || []).forEach((h) => add(h.month, h.day, h.name, 'libur'));
  (cutiBersama[year] || []).forEach((h) => add(h.month, h.day, h.name, 'cuti'));

  return result;
}

export function getHolidayForDate(year: number, month: number, day: number): string[] {
  const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const holidays = getHolidaysForMonth(year, month);
  return holidays[key] || [];
}
