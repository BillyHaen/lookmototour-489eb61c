

## Perubahan: Sembunyikan Biaya & Kuota untuk Event Tentative

### Apa yang berubah
Di sidebar kanan halaman **EventDetail.tsx** (baris 309-343), jika event bersifat tentative (`event.tentative_month` terisi), maka:
- **Sembunyikan** seluruh blok "Biaya Pendaftaran" (harga Sharing/Single/Couple dan label GRATIS)
- **Sembunyikan** seluruh blok kuota (progress bar + slot tersisa)
- **Tampilkan** sebagai gantinya: teks "Biaya perjalanan akan diupdate!" dengan styling yang sesuai

### File yang diubah
**`src/pages/EventDetail.tsx`** — Wrap blok biaya (baris 309-334) dan kuota (baris 336-343) dalam kondisi `!isTentative`, lalu tambahkan blok alternatif untuk tentative.

### Detail teknis
```tsx
const isTentative = !!(event as any).tentative_month;

// Di sidebar:
{isTentative ? (
  <div className="text-center py-4">
    <p className="text-muted-foreground text-sm">Biaya perjalanan akan diupdate!</p>
  </div>
) : (
  <>
    {/* Blok biaya pendaftaran yang sudah ada */}
    {/* Blok kuota yang sudah ada */}
  </>
)}
```

Hanya 1 file yang perlu diubah, perubahan kecil dan terlokalisir.

