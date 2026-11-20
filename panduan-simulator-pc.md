# Cek Tap Simulator GlassWallet di PC

Kenapa harus di PC: simulator butuh jendela aslinya (Even Hub Simulator) untuk
mengirim event tap/scroll ke aplikasi. Di server Joko yang tanpa layar, tombol
Click/Down-nya tidak merespons — itu keterbatasan mesin, bukan bug aplikasi.
Di PC Windows dengan layar asli, klik tombol itu harusnya jalan.

**Update 20 Nov ~15:30 WIB:** Joko sudah mengetes jalur tap-nya sendiri dengan
harness mock-bridge (test/bridge-test.mjs) — **10/10 lolos**: tap pindah layar,
ring scroll ganti jumlah, scroll ke atas batal, tap saat sending diabaikan,
double-tap keluar. Tes itu juga menemukan satu bug asli (layar "Sending..."
tidak pernah tampil) yang sudah diperbaiki. Jadi yang tersisa di PC ini hanya
konfirmasi akhir bahwa tombol Click/Down simulator-nya merespons di mesin asli.

## Yang dibutuhkan
- Node.js LTS (kalau belum ada: https://nodejs.org — pilih LTS, install biasa)
- Git (kalau belum ada: https://git-scm.com/download/win — install biasa)
  atau tanpa Git: download ZIP repo dari https://github.com/nastari142/GlassWallet
  (tombol hijau "Code" → "Download ZIP", lalu extract)

## Langkah
1. Buka Command Prompt atau PowerShell.
2. Clone repo (atau masuk ke folder hasil extract ZIP):
   ```
   git clone https://github.com/nastari142/GlassWallet
   cd GlassWallet
   ```
3. Install dependency (sekali saja, tunggu sampai selesai):
   ```
   npm install
   ```
4. Terminal 1 — jalankan dev server (biarkan jalan):
   ```
   npm run dev
   ```
   Tunggu sampai muncul `Local: http://localhost:5173/` — jangan tutup terminal ini.
5. Buka terminal ke-2 di folder yang sama, jalankan simulator:
   ```
   npm run simulate
   ```
   Jendela simulator akan terbuka dan menampilkan layar Balance (saldo 1.2847 BNB,
   harga BNB live, alamat demo, dan baris alert Telegram).

## Yang dites (klik tombol di jendela simulator)
1. **Balance → Send:** klik tombol **Click** (atau klik langsung di kanvas) → layar
   harus pindah ke Send (penerima 0x1234…5678, jumlah 0.01 BNB).
2. **Ganti jumlah:** klik **Down** beberapa kali → jumlah harus berubah
   0.01 → 0.05 → 0.1 → 0.5 BNB. Klik **Up** → kembali ke jumlah sebelumnya.
3. **Send → Confirm:** klik **Click** → layar Confirm (jumlah, penerima, fee).
4. **Confirm → Sending → Success:** klik **Click** → layar Sending sebentar, lalu
   Success (mock tx hash + saldo baru).
5. **Success → Balance:** klik **Click** → kembali ke layar Balance.
6. **Double-tap keluar:** klik 2x cepat di mana saja → aplikasi keluar
   (ini perilaku sistem yang wajib di root page).

## Kalau ada yang tidak jalan
Catat di langkah nomor berapa dan apa yang terjadi (misal: layar tidak pindah,
jumlah tidak berubah, simulator tidak terbuka, atau error di terminal), lalu
kirim ke Joko — sertakan screenshot kalau bisa. Kalau semua langkah 1–5 jalan,
berarti tap/scroll di simulator sudah terbukti bekerja dan tidak ada yang perlu
diubah di kode sebelum demo day.

## Catatan
- Harga BNB di layar Balance diambil live dari CoinGecko (butuh internet).
- Semua saldo dan transaksi di simulator ini MOCK — tidak ada dana asli yang bergerak.
- Jangan tutup terminal `npm run dev` selama simulator dipakai.
