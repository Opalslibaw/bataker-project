# 🃏 Kartu Batak — Bataker Project

> Permainan kartu Joker (Jokeran) berbasis web bergaya kasino mewah, dengan mode solo melawan bot dan multiplayer online secara real-time.

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Demo & Halaman](#demo--halaman)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Cara Menjalankan](#cara-menjalankan)
- [Konfigurasi Supabase](#konfigurasi-supabase)
- [Skema Database](#skema-database)
- [Gameplay](#gameplay)
- [Sistem Koin & Reward](#sistem-koin--reward)
- [Sistem Bonus Harian & Misi](#sistem-bonus-harian--misi)

---

## Tentang Proyek

**Kartu Batak** adalah implementasi digital dari permainan kartu rakyat Indonesia yang dikenal dengan nama *Jokeran* atau *Kartu Setan* — turunan dari permainan *Old Maid* asal Eropa. Permainan ini dibangun dengan estetika kasino mewah bertema gelap, animasi yang kaya, dan pengalaman bermain yang imersif.

Proyek ini mendukung dua mode permainan:
- **Solo** — bermain melawan 3 bot AI dengan logika berbasis giliran
- **Multiplayer** — bermain bersama pemain nyata secara real-time via Supabase Realtime

---

## Fitur Utama

### Gameplay
- Permainan kartu Joker (53 kartu, 1 Joker) untuk 4–8 pemain
- Mode solo melawan 3 bot AI dengan delay realistis
- Mode multiplayer online dengan room berbasis kode 6 karakter
- Sistem pasangan (pair elimination) otomatis saat kartu diterima
- Animasi visual ketika mendapat pasangan atau mendapat Joker

### Autentikasi & Profil
- Login/Register via email menggunakan Supabase Auth
- Halaman profil dengan statistik permainan (main, menang, kalah)
- Upload avatar (foto profil)
- Edit username

### Sistem Koin
- Koin diperoleh dari kemenangan, bonus harian, misi, dan taruhan multiplayer
- Reward: +50 koin per kemenangan solo, +25 koin per achievement
- Sistem taruhan (bet) antar pemain di room multiplayer
- Riwayat transaksi koin tercatat di database

### Bonus Harian & Misi
- Bonus login harian: 25 koin per hari + bonus streak (hingga +50 koin di hari ke-7)
- 3 misi harian acak (ditentukan berdasarkan userId + tanggal, deterministik)
- Contoh misi: *Main 1 Partai*, *Menang Sekali*, *Coba Multiplayer*
- Reward misi berkisar 30–120 koin

### Leaderboard
- Papan peringkat global berdasarkan total koin
- Tampilan rank khusus untuk peringkat 1–3 (gold, silver, bronze)
- Bisa diakses tanpa login

### Live Chat
- Chat room real-time di dalam setiap room multiplayer
- Fallback polling 2 detik jika WebSocket tidak tersedia
- Dukungan emoji picker (10 emoji)
- Menampilkan nama dan waktu pengiriman pesan

### Music Player
- Background music kasino bawaan (3 track: *Las Vegas*, *Robbery of the Century*, *Poker Player*)
- Kontrol play/pause, next track, volume
- Posisi minimized di sudut layar

### Dark Mode
- Toggle antara tema gelap ekstra pekat dan sedikit lebih terang
- Persisten via `localStorage`

### UI & Animasi
- Animasi loading screen saat pertama buka
- Kartu interaktif yang bisa di-drag (desktop) dengan efek lempar dan fisika spring
- Spotlight efek mengikuti kursor mouse
- Partikel simbol kartu (♠ ♥ ♦ ♣) melayang di latar belakang (mobile)
- Animasi pop-up khusus saat mendapat Joker atau berhasil buang pasangan
- Semua animasi menggunakan Framer Motion

---

## Demo & Halaman

| Route | Keterangan | Akses |
|---|---|---|
| `/` | Halaman beranda (hero, fitur, CTA) | Publik |
| `/login` | Login & Register | Publik |
| `/history` | Sejarah permainan Joker di dunia | Publik |
| `/leaderboard` | Papan peringkat global | Publik |
| `/lobby` | Buat atau join room multiplayer | Login |
| `/game` | Permainan solo vs bot | Login |
| `/multiplayer` | Permainan multiplayer online | Login |
| `/profile` | Profil, statistik, misi harian | Login |

---

## Tech Stack

| Teknologi | Versi | Kegunaan |
|---|---|---|
| **React** | 19.x | UI Framework |
| **Vite** | 7.x | Build tool & dev server |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Framer Motion** | 12.x | Animasi komponen |
| **Supabase JS** | 2.x | Auth, database, realtime |
| **React Router DOM** | 7.x | Client-side routing |
| **Howler.js** | 2.x | Web Audio / musik latar |
| **Lucide React** | 0.577 | Icon library |

**Backend / BaaS:** [Supabase](https://supabase.com) (PostgreSQL + Auth + Realtime + Storage)

**Deploy:** Vercel (konfigurasi `vercel.json` disertakan, termasuk `_redirects` untuk SPA routing)

---

## Struktur Proyek

```
bataker-project-main/
├── public/
│   └── music/              # File audio latar (3 track .mp3)
├── src/
│   ├── components/
│   │   ├── ChatBox.jsx     # Live chat real-time
│   │   ├── CoinDisplay.jsx # Tampilan saldo koin di navbar
│   │   ├── DailyPanel.jsx  # Panel bonus harian & misi
│   │   ├── Layout.jsx      # Layout dengan navbar
│   │   ├── MusicPlayer.jsx # Background music player
│   │   └── ProtectedRoute.jsx
│   ├── hooks/
│   │   ├── useAuth.jsx     # Context & hook autentikasi
│   │   ├── useCoins.js     # Operasi koin (add, deduct, bet)
│   │   ├── useDailyBonus.js# Logika bonus harian & misi
│   │   ├── useDarkMode.js  # Toggle dark mode
│   │   ├── useMultiplayer.js# Supabase Realtime untuk multiplayer
│   │   └── useSound.js     # Sound effects (win, lose, card, dll)
│   ├── lib/
│   │   └── supabase.js     # Inisialisasi Supabase client
│   ├── pages/
│   │   ├── Home.jsx        # Landing page
│   │   ├── Login.jsx       # Auth (login & register)
│   │   ├── Game.jsx        # Solo game vs bot
│   │   ├── MultiplayerGame.jsx # Game multiplayer online
│   │   ├── Lobby.jsx       # Buat/join room
│   │   ├── Leaderboard.jsx # Papan peringkat
│   │   ├── History.jsx     # Sejarah permainan Joker
│   │   └── Profile.jsx     # Profil & statistik user
│   ├── App.jsx             # Route definitions
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── vercel.json
```

---

## Cara Menjalankan

### Prasyarat
- Node.js >= 18
- npm atau yarn
- Akun [Supabase](https://supabase.com) (gratis)

### Instalasi

```bash
# Clone repository
git clone <url-repo>
cd bataker-project-main

# Install dependencies
npm install
```

### Konfigurasi Environment

Buat file `.env` di root proyek:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Jalankan Dev Server

```bash
npm run dev
```

### Build Production

```bash
npm run build
npm run preview
```

---

## Konfigurasi Supabase

### Auth
Aktifkan **Email Auth** di Supabase Dashboard → Authentication → Providers.

### Storage (opsional, untuk avatar)
Buat bucket bernama `avatars` dengan akses publik.

### RPC Functions
Buat fungsi PostgreSQL berikut di SQL Editor Supabase:

```sql
-- Tambah / kurangi koin secara atomic
CREATE OR REPLACE FUNCTION add_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT,
  p_ref TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE profiles
  SET coins = coins + p_amount
  WHERE id = p_user_id
  RETURNING coins INTO new_balance;

  INSERT INTO coin_transactions (user_id, amount, reason, reference_id)
  VALUES (p_user_id, p_amount, p_reason, p_ref);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Settle taruhan setelah game selesai
CREATE OR REPLACE FUNCTION settle_bet(
  p_room_id UUID,
  p_winner_id UUID
) RETURNS VOID AS $$
DECLARE
  total_pot INTEGER;
  loser RECORD;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_pot
  FROM room_bets WHERE room_id = p_room_id AND status = 'pending';

  FOR loser IN
    SELECT user_id, amount FROM room_bets
    WHERE room_id = p_room_id AND status = 'pending' AND user_id != p_winner_id
  LOOP
    UPDATE profiles SET coins = coins - loser.amount WHERE id = loser.user_id;
  END LOOP;

  UPDATE profiles SET coins = coins + total_pot WHERE id = p_winner_id;
  UPDATE room_bets SET status = 'settled' WHERE room_id = p_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Skema Database

### Tabel Utama

```sql
-- Profil pemain
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  coins INTEGER DEFAULT 100,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Room multiplayer
CREATE TABLE game_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,           -- 6 karakter alfanumerik
  host_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'waiting',       -- waiting | playing | finished
  max_players INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pemain dalam room
CREATE TABLE room_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  username TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- State permainan (disimpan sebagai JSON)
CREATE TABLE game_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE UNIQUE,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat / pesan
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Transaksi koin
CREATE TABLE coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  reason TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Taruhan per room
CREATE TABLE room_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',       -- pending | settled
  UNIQUE(room_id, user_id)
);

-- Bonus harian
CREATE TABLE daily_bonuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  last_claimed_at TIMESTAMPTZ,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Progres misi harian
CREATE TABLE daily_missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_date DATE DEFAULT CURRENT_DATE,
  missions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, mission_date)
);

-- View leaderboard
CREATE VIEW leaderboard AS
SELECT id, username, avatar_url, coins, games_played, games_won
FROM profiles
ORDER BY coins DESC
LIMIT 100;
```

### Row Level Security (RLS)

Aktifkan RLS pada semua tabel dan tambahkan policy berikut (contoh untuk `profiles`):

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
```

---

## Gameplay

### Aturan Dasar

1. Deck terdiri dari 52 kartu standar + 1 Joker (53 kartu total)
2. Kartu dibagikan merata ke seluruh pemain
3. Setiap pemain langsung membuang semua **pasangan kartu** (kartu dengan rank yang sama, misal dua buah King)
4. Joker tidak bisa dipasangkan — kartu ini terus beredar
5. Secara bergiliran, setiap pemain mengambil 1 kartu acak dari tangan pemain di sebelah kanannya
6. Jika kartu yang diambil membentuk pasangan, pasangan itu langsung dibuang
7. Pemain yang berhasil mengosongkan tangannya dinyatakan **selamat**
8. Pemain terakhir yang masih memegang kartu (pasti memegang Joker) adalah **pemegang Joker** — dan kalah

### Mode Solo

- Pemain melawan 3 bot AI
- Bot mengambil kartu secara acak dengan delay 1,2 detik per giliran
- Statistik menang/kalah disimpan ke profil Supabase
- Bonus koin +50 jika menang

### Mode Multiplayer

1. **Buat Room** — host mendapatkan kode 6 karakter
2. **Join Room** — pemain lain memasukkan kode yang sama
3. Host bisa menambah bot untuk mengisi slot yang kosong
4. Setelah semua siap, host memulai game
5. Game state disinkronisasi real-time melalui Supabase Realtime (PostgreSQL Changes)
6. Pemain bisa memasang taruhan koin sebelum game dimulai
7. Taruhan diselesaikan secara otomatis ketika game berakhir

---

## Sistem Koin & Reward

| Sumber | Jumlah Koin |
|---|---|
| Kemenangan game solo | +50 |
| Kemenangan game multiplayer | +bagian dari pot taruhan |
| Bonus login harian | +25 (base) |
| Streak hari ke-3/4 | +10 bonus |
| Streak hari ke-5/6 | +25 bonus |
| Streak hari ke-7+ | +50 bonus |
| Misi harian selesai | +30 s/d +120 per misi |

---

## Sistem Bonus Harian & Misi

Setiap hari, pemain mendapatkan 3 misi dari pool berikut (dipilih secara deterministik berdasarkan `userId + tanggal`):

| ID Misi | Label | Target | Reward |
|---|---|---|---|
| `play_1` | Main 1 Partai | 1 game | 30 koin |
| `play_3` | Main 3 Partai | 3 game | 75 koin |
| `win_1` | Menang Sekali | 1 kemenangan | 50 koin |
| `win_2` | Dua Kemenangan | 2 kemenangan | 120 koin |
| `multi_1` | Coba Multiplayer | 1 game multiplayer | 60 koin |

Misi di-reset setiap hari tengah malam (berdasarkan tanggal UTC). Progres disimpan di tabel `daily_missions`.

---

## Lisensi

Proyek ini bersifat privat — **Bataker Project © 2026**.
