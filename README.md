# Game Kuliner Online

Game bisnis kuliner multiplayer. Pemain berebut stok bahan di pasar bersama, memasak, dan yang uangnya terbanyak di akhir game menang.
Frontend statis (HTML/CSS/JS) + Supabase (database, realtime). Tidak perlu build.

## Isi folder
- `index.html`, `style.css`: tampilan
- `app.js`: karakter, nama, lobby, room
- `game.js`: gameplay (menu harian, masak, pasar, alat, peringkat)
- `config.js`: URL dan key Supabase
- `supabase/schema.sql`: tabel pemain, room, lobby
- `supabase/gameplay.sql`: data 60 masakan, bahan, alat, dan aturan game

## Cara pasang
### 1. Supabase
1. Authentication -> Sign In / Providers -> aktifkan **Allow anonymous sign-ins**.
2. SQL Editor -> tempel isi `supabase/schema.sql` -> Run. (Lewati jika sudah pernah dijalankan.)
3. Query baru -> tempel isi `supabase/gameplay.sql` -> Run.
4. Isi `config.js` dengan Project URL dan anon/publishable key (Project Settings -> API). Jangan pakai service_role key.

### 2. GitHub
Upload semua isi folder ini ke repo (`index.html` harus di folder paling luar).

### 3. Hosting
Vercel (Add New Project -> pilih repo -> Framework Preset: Other -> Deploy), atau Netlify, atau GitHub Pages (repo harus public).

## Aturan main
- Modal Rp500.000. Tiap hari ada 3 menu, event harga, dan stok pasar diisi ulang.
- Stok pasar dibagi satu room: siapa cepat dia dapat.
- Alat aus 2% per porsi. Beli baru = 100%, perbaiki (saat kondisi 50% ke bawah) = 50-75%.
- Memasak butuh waktu per porsi. Uang masuk saat selesai dimasak.
- Setelah hari terakhir, uang terbanyak menang. Pemain yang keluar room dianggap kalah.

## Belum ada
Pecahan uang, spectate, gambar, jual-beli antar pemain.
