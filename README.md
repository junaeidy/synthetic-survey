# SimSurvei — Synthetic Survey & Bot Response Simulator

Aplikasi kuesioner dan simulasi riset dengan pengisi otomatis (**Bot AI**) berbasis **Gemini API** dan database **Supabase**, dirancang dengan visualisasi data dinamis dan estetika **Anti-Slop** (`elayadesign/ai-design-skills`).

---

## 🌟 Fitur Utama

1. **Form / Questionnaire Builder Fleksibel:**
   - Pertanyaan Pilihan Ganda (A, B, C, D...)
   - Pertanyaan Benar / Salah (Ya / Tidak)
   - Pertanyaan Isian Bebas (Kualitatif / Teks Pendapat)
   - Template riset siap pakai (Layanan Kampus, E-Commerce, dll.)

2. **Mesin Bot Responden Berbasis Gemini Flash & Smart Batching:**
   - **Aman Rate-Limit (15 RPM):** Menghasilkan 5–10 persona responden Indonesia unik dalam 1 kali panggilan AI. Untuk 50–100 responden hanya butuh 10–12 panggilan API (~2-3 menit pengerjaan, jauh di bawah batas 1 jam).
   - **Variasi Persona & Sentimen:** Profil usia, pekerjaan, dan sikap (positif, netral, kritis).
   - **Teks Alami (Anti-Slop):** Respons isian bebas terdengar seperti ketikan manusia asli, bukan bahasa AI generik/kaku.

3. **Distribusi Waktu Realistis (Jendela H+0 s/d H+7):**
   - Timestamp pengisian (`submitted_at`) diacak realistis dalam rentang tanggal yang Anda tentukan (pukul 08:00–22:00).
   - Dilengkapi grafik linimasa **Area Chart** yang menampilkan tren akumulasi dan laju pengisian harian.

4. **Dashboard Visualisasi Dinamis:**
   - Admin dapat mengganti tipe grafik secara instan per pertanyaan:
     - **Diagram Batang Vertikal (Bar)**
     - **Diagram Batang Horizontal**
     - **Diagram Donat (Donut)**
     - **Diagram Lingkaran (Pie)**
   - Feed khusus isian bebas dengan pencarian dan filter sentimen.
   - **Ekspor Data ke CSV:** Satu klik untuk download seluruh data responden & jawaban mentah untuk analisis SPSS/Excel.

5. **Arsitektur Dual-Mode (Supabase + Local Mock Storage):**
   - Jika Supabase belum dikonfigurasi, aplikasi tetap langsung jalan 100% menggunakan Local Storage bawaan browser! Begitu kredensial Supabase dimasukkan di `.env.local`, data otomatis sinkron ke Supabase Cloud.

---

## 🚀 Panduan Setup & Menjalankan

### 1. Masuk ke Direktori Proyek
```bash
cd C:\Users\Meee\.gemini\antigravity\scratch\synthetic-survey-sim
```

### 2. Konfigurasi Environment Variable (`.env.local`)
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi variabel berikut:
```env
# Supabase (dari Project Settings -> API di dashboard Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini API (simpan key hanya di server; jangan gunakan prefix NEXT_PUBLIC_)
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_GEMINI_CONFIGURED=true
```
*(Catatan: Jika API key belum diisi, sistem otomatis beralih ke mode heuristik cerdas offline sehingga Anda tetap bisa mencoba aplikasi tanpa hambatan).*

### 3. Setup Database Supabase
Buka **Supabase Dashboard** -> Proyek Anda -> **SQL Editor** -> Jalankan isi file [`supabase/schema.sql`](./supabase/schema.sql).

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka browser di: `http://localhost:3000`

### 5. Build untuk Produksi
```bash
npm run build
npm start
```

---

## ☁️ Deploy ke Vercel

1. Push folder proyek ini ke repository GitHub Anda (`git init`, `git add .`, `git commit -m "feat: initial commit"`, `git push`).
2. Buka [vercel.com](https://vercel.com) -> **Add New Project** -> Pilih repository.
3. Di bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_GEMINI_CONFIGURED=true`
4. Klik **Deploy**!
