-- =====================================================
-- GAME KULINER - TAHAP 1: Pemain, Room, Lobby
-- Cara pakai: Supabase > SQL Editor > paste semua > Run
-- Sebelum itu: Authentication > Sign In / Providers >
-- aktifkan "Allow anonymous sign-ins"
-- =====================================================

-- 1) PEMAIN (karakter + nama)
create table players (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Pemain'
    check (char_length(name) between 1 and 20),
  skin text not null default 'default',
  face text not null default 'default',
  hair text not null default 'default',
  accessory text not null default 'none',
  created_at timestamptz not null default now()
);

-- 2) ROOM
-- Bulatan lobby:
--   merah = status 'playing'
--   hijau = status 'waiting' dan has_password = false
--   abu   = status 'waiting' dan has_password = true
create table rooms (
  id text primary key,
  host_id uuid not null references players(id),
  max_players int not null default 4
    check (max_players between 2 and 10),
  total_days int not null default 7
    check (total_days between 3 and 30),
  day_duration_sec int not null default 180
    check (day_duration_sec in (120, 180, 300)),
  has_password boolean not null default false,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'finished')),
  created_at timestamptz not null default now()
);

-- Password disimpan terpisah supaya tidak bisa dibaca pemain lain
create table room_secrets (
  room_id text primary key references rooms(id) on delete cascade,
  password text not null
);

-- 3) ANGGOTA ROOM (satu pemain hanya boleh di satu room)
create table room_players (
  player_id uuid primary key references players(id) on delete cascade,
  room_id text not null references rooms(id) on delete cascade,
  joined_at timestamptz not null default now()
);
create index on room_players (room_id);

-- 4) TAMPILAN UNTUK DAFTAR LOBBY
create view lobby_rooms with (security_invoker = true) as
select
  r.id,
  p.name as host_name,
  r.max_players,
  r.has_password,
  r.status,
  r.total_days,
  r.day_duration_sec,
  (select count(*) from room_players rp where rp.room_id = r.id) as player_count
from rooms r
join players p on p.id = r.host_id;

-- 5) KEAMANAN (RLS)
alter table players enable row level security;
alter table rooms enable row level security;
alter table room_secrets enable row level security;
alter table room_players enable row level security;

-- Semua pemain login boleh melihat pemain, room, dan anggota room
create policy "lihat pemain" on players
  for select to authenticated using (true);
create policy "lihat room" on rooms
  for select to authenticated using (true);
create policy "lihat anggota room" on room_players
  for select to authenticated using (true);

-- Pemain hanya boleh membuat dan mengubah data dirinya sendiri
create policy "buat pemain sendiri" on players
  for insert to authenticated with check (id = auth.uid());
create policy "ubah pemain sendiri" on players
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- room, room_players, room_secrets TIDAK punya policy tulis/baca langsung.
-- Semua perubahan lewat fungsi di bawah (server yang memutuskan).

-- 6) FUNGSI: KELUAR ROOM
create or replace function leave_room(p_room_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next uuid;
begin
  delete from room_players
  where room_id = p_room_id and player_id = auth.uid();

  if not exists (select 1 from room_players where room_id = p_room_id) then
    -- room kosong, hapus
    delete from rooms where id = p_room_id;
  elsif (select host_id from rooms where id = p_room_id) = auth.uid() then
    -- host keluar, serahkan ke pemain yang paling lama masuk
    select player_id into v_next
    from room_players
    where room_id = p_room_id
    order by joined_at
    limit 1;
    update rooms set host_id = v_next where id = p_room_id;
  end if;
end;
$$;

-- 7) FUNGSI: BUAT ROOM
create or replace function create_room(
  p_max int,
  p_days int,
  p_duration int,
  p_password text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_pass text := nullif(upper(trim(coalesce(p_password, ''))), '');
begin
  if auth.uid() is null then
    raise exception 'Belum login';
  end if;

  if v_pass is not null and v_pass !~ '^[A-Z0-9]+$' then
    raise exception 'Password hanya boleh huruf dan angka';
  end if;

  -- keluar dulu dari room lama (kalau ada)
  perform leave_room(room_id)
  from room_players where player_id = auth.uid();

  -- buat kode room 5 karakter yang belum dipakai
  loop
    v_id := upper(substr(md5(random()::text), 1, 5));
    exit when not exists (select 1 from rooms where id = v_id);
  end loop;

  insert into rooms (id, host_id, max_players, total_days, day_duration_sec, has_password)
  values (v_id, auth.uid(), p_max, p_days, p_duration, v_pass is not null);

  if v_pass is not null then
    insert into room_secrets (room_id, password) values (v_id, v_pass);
  end if;

  insert into room_players (player_id, room_id) values (auth.uid(), v_id);

  return v_id;
end;
$$;

-- 8) FUNGSI: MASUK ROOM
create or replace function join_room(p_room_id text, p_password text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r rooms;
  v_pass text;
begin
  if auth.uid() is null then
    raise exception 'Belum login';
  end if;

  select * into r from rooms where id = upper(trim(p_room_id)) for update;

  if not found then
    raise exception 'Room tidak ditemukan';
  end if;
  if r.status <> 'waiting' then
    raise exception 'Room sedang bermain';
  end if;
  if (select count(*) from room_players where room_id = r.id) >= r.max_players then
    raise exception 'Room penuh';
  end if;

  if r.has_password then
    select password into v_pass from room_secrets where room_id = r.id;
    if v_pass is distinct from upper(trim(coalesce(p_password, ''))) then
      raise exception 'Password salah';
    end if;
  end if;

  -- keluar dari room lain (kalau ada)
  perform leave_room(room_id)
  from room_players
  where player_id = auth.uid() and room_id <> r.id;

  insert into room_players (player_id, room_id)
  values (auth.uid(), r.id)
  on conflict do nothing;
end;
$$;

-- 9) HAK AKSES FUNGSI (hanya pemain yang sudah login)
revoke execute on function leave_room(text) from public;
revoke execute on function create_room(int, int, int, text) from public;
revoke execute on function join_room(text, text) from public;
grant execute on function leave_room(text) to authenticated;
grant execute on function create_room(int, int, int, text) to authenticated;
grant execute on function join_room(text, text) to authenticated;

-- 10) REALTIME (supaya lobby dan isi room update langsung)
alter publication supabase_realtime add table rooms, room_players, players;

-- 11) IZIN AKSES (karena "expose new tables" dimatikan)
grant select on players, rooms, room_players, lobby_rooms to authenticated;
grant insert, update on players to authenticated;
