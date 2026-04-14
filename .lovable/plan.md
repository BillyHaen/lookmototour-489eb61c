

## Fitur: AI Trip Match — "Find Your Perfect Ride"

### Konsep
Pengalaman interaktif bergaya Netflix di mana user menjawab 4 pertanyaan cepat (swipeable cards), lalu mendapat rekomendasi touring yang dipersonalisasi menggunakan Lovable AI. Hasilnya ditampilkan dalam layout carousel "Netflix-style" dengan kategori seperti "Perfect Match", "Worth Trying", dll.

### Alur User
```text
[Tombol "🎯 Find My Ride" di halaman Events]
       ↓
[Step 1] Pengalaman riding → Pemula / Menengah / Expert
[Step 2] Budget range → < 500rb / 500rb-1.5jt / 1.5jt-3jt / 3jt+
[Step 3] Gaya touring → Santai & Coffee / Gaspol Adventure / Luxury / Spiritual
[Step 4] Prefer view → 🏖️ Pantai / 🏔️ Gunung / 🏙️ Kota / 🌾 Pedesaan
       ↓
[Loading animation "Matching trips..."]
       ↓
[Hasil: Netflix-style rows]
  → "🎯 Perfect Match" (skor tinggi)
  → "🔥 Worth Trying" (skor sedang)
  → "💡 Something Different" (wildcard)
```

### Implementasi

**1. Edge Function `ai-trip-match`** — Menerima jawaban kuisioner + daftar event, kirim ke Lovable AI (gemini-3-flash-preview) untuk scoring & categorization. AI mengembalikan structured output berupa event IDs dengan skor dan alasan rekomendasi.

**2. Halaman baru `/trip-match`** — Full-screen quiz experience:
- 4 step wizard dengan animasi slide
- Setiap step = 1 pertanyaan dengan pilihan visual (card/button besar dengan icon)
- Progress bar di atas
- Setelah submit → loading state dengan animasi
- Hasil dalam layout horizontal scroll per kategori (Netflix-style)

**3. Komponen baru:**
- `src/pages/TripMatch.tsx` — Halaman utama quiz + hasil
- `src/components/TripMatchQuiz.tsx` — Komponen wizard 4 langkah
- `src/components/TripMatchResults.tsx` — Netflix-style carousel hasil

**4. Integrasi:**
- Tambah route `/trip-match` di App.tsx
- Tambah tombol CTA "🎯 Find My Ride" di halaman Events (di atas filter)
- Opsional: CTA kecil di homepage

### File yang Dibuat/Diubah
| File | Aksi |
|------|------|
| `supabase/functions/ai-trip-match/index.ts` | Baru — Edge function AI matching |
| `src/pages/TripMatch.tsx` | Baru — Halaman quiz + hasil |
| `src/components/TripMatchQuiz.tsx` | Baru — Wizard kuisioner |
| `src/components/TripMatchResults.tsx` | Baru — Netflix-style carousel |
| `src/App.tsx` | Edit — Tambah route `/trip-match` |
| `src/pages/Events.tsx` | Edit — Tambah CTA button |

### Detail Teknis

**Edge Function** mengirim prompt ke AI dengan konteks semua event aktif (title, category, location, price, difficulty, touring_style, rider_level, motor_types) + jawaban user. AI mengembalikan structured output via tool calling:
```json
{
  "categories": [
    { "label": "Perfect Match", "emoji": "🎯", "event_ids": ["id1", "id2"] },
    { "label": "Worth Trying", "emoji": "🔥", "event_ids": ["id3"] },
    { "label": "Something Different", "emoji": "💡", "event_ids": ["id4"] }
  ],
  "reasons": { "id1": "Cocok untuk pemula dengan budget pas...", ... }
}
```

**Netflix-style UI**: Setiap kategori = 1 row horizontal scrollable dengan snap scroll, card event lebih besar dari biasa + alasan rekomendasi AI di bawahnya.

