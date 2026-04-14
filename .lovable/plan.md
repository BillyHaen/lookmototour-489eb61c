

## Perubahan Tone Warna Website Sesuai Logo

### Analisis Logo
Logo LookMotoTour menggunakan warna **dark navy blue** (sekitar `hsl(215, 50%, 20%)`) dengan elemen putih. Saat ini website menggunakan **orange** (`hsl(25, 95%, 53%)`) sebagai primary — tidak sesuai dengan identitas logo.

### Palet Warna Baru

Mengubah skema warna agar serasi dengan logo navy blue, tetap mempertahankan kesan profesional dan mudah dibaca:

| Token | Lama | Baru | Keterangan |
|-------|------|------|------------|
| `--primary` | Orange `25 95% 53%` | Navy Blue `215 70% 35%` | Warna utama sesuai logo |
| `--accent` | Teal `160 60% 40%` | Sky Blue `200 80% 55%` | Aksen cerah pelengkap navy |
| `--ring` | Orange | Navy Blue | Fokus/ring mengikuti primary |
| `--gradient-primary` | Orange gradient | Navy → Sky Blue gradient | Gradient serasi |
| Sidebar primary | Orange | Navy Blue | Konsisten |

### Perubahan yang Dilakukan

**1. `src/index.css`** — Update CSS variables:
- Light mode: primary → navy blue, accent → sky blue, ring → navy
- Dark mode: primary & accent disesuaikan (sedikit lebih cerah untuk kontras)
- Gradient-primary → navy ke sky blue
- Sidebar colors mengikuti primary baru

**2. `src/components/HeroSection.tsx`** — Ganti hardcoded `hsl(25 95% 53%)` di stat icons ke warna primary baru

**3. Tidak perlu mengubah komponen lain** karena semua sudah menggunakan token `text-primary`, `bg-primary`, dll. yang akan otomatis mengikuti CSS variable baru.

### Prinsip Estetika
- Navy blue = profesional, trustworthy, maskulin — cocok untuk komunitas touring motor
- Sky blue accent = memberikan kontras yang cukup tanpa terlalu mencolok
- Foreground/background tetap sama agar readability tidak terganggu
- Dark mode tetap terjaga dengan primary yang sedikit lebih cerah

