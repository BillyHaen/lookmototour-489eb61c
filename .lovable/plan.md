
# Aksi semi-otomatis "Reattach mapping check"

## Tujuan
Memicu refresh mapping published deployment ke `lookmototour-dev2.lovable.app`, `lookmototour.com`, dan `www.lookmototour.com` menggunakan tool yang tersedia di editor, lalu memverifikasi hasilnya via polling HTTP.

## Langkah eksekusi (default mode)

1. **Baca state awal**
   - `publish_settings--get_publish_settings` untuk konfirmasi published + visibility saat ini.
   - `project_urls--get_urls` untuk konfirmasi daftar URL aktif.

2. **Toggle visibility sebagai trigger refresh mapping** (satu-satunya tuas yang tersedia dari editor)
   - `publish_settings--update_visibility('private')` — minta approval user.
   - `project_debug--sleep(15)` untuk beri waktu propagasi.
   - `publish_settings--update_visibility('public')` — minta approval user.
   - `project_debug--sleep(10)` setelah balik public.

3. **Polling HTTP status** via `code--exec` (curl)
   - Target:
     - `https://lookmototour-dev2.lovable.app`
     - `https://lookmototour.com`
     - `https://www.lookmototour.com`
   - Maksimum 10 percobaan, jeda 10 detik antar percobaan.
   - Berhenti lebih awal jika ketiga URL HTTP **200** dan body BUKAN halaman "Project not found".

4. **Tampilkan hasil akhir** dalam tabel:
   - URL → status code → keterangan (OK / "Project not found" / error) → timestamp.

5. **Branching hasil**
   - Jika ketiga URL kembali 200 → reattach dianggap berhasil, selesai.
   - Jika minimal satu URL masih 404 → otomatis generate paket laporan support terbaru:
     - URL + status code per percobaan
     - Timestamp percobaan
     - Daftar tindakan yang sudah dicoba (toggle visibility, unpublish/republish sebelumnya)
     - Catatan DNS sudah benar mengarah ke `185.158.133.1`
   - Sertakan rekomendasi kirim laporan ke Lovable Support karena rebind hosting nyata hanya bisa dilakukan tim infra Lovable.

## Yang TIDAK akan diubah

- Tidak ada perubahan di `src/`, `index.html`, routing, atau `NotFound.tsx` — preview app sehat, masalah murni di hosting binding.
- Tidak ubah DNS — sudah benar mengarah ke IP Lovable.

## Catatan jujur

Toggle visibility + polling adalah satu-satunya yang benar-benar otomatis dari sisi editor. Tidak ada tool `rebind_domain` / `reattach_deployment` yang publik. Jika setelah polling masih 404, jalur akhirnya tetap Lovable Support.
