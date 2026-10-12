-- TAHAP 2: GAMEPLAY. Jalankan di Supabase > SQL Editor (setelah tahap1_lobby.sql)
create table items(id text primary key,name text not null,price int not null,stk int not null);
create table tooldefs(id text primary key,name text not null,price int not null);
create table recipes(id int primary key,name text not null,cat text not null,price int not null,ing jsonb not null,tool text not null references tooldefs(id));
create table games(room_id text primary key references rooms(id) on delete cascade,day int not null default 0,day_ends timestamptz,mult numeric not null default 1,ev text,menu int[] not null default '{}');
create table gp(room_id text references rooms(id) on delete cascade,player_id uuid references players(id) on delete cascade,money int not null,busy_until timestamptz,primary key(room_id,player_id));
create table inv(room_id text,player_id uuid,item text,qty int not null,primary key(room_id,player_id,item),foreign key(room_id,player_id) references gp on delete cascade);
create table mk(room_id text references rooms(id) on delete cascade,item text references items(id),stock int not null,primary key(room_id,item));

-- stk = stok pasar per pemain per hari
insert into items values
('ber','Beras',1500,40),('tel','Telur',2500,30),('min','Minyak',1000,40),('baw','Bawang',1500,30),('cab','Cabai',2000,25),
('tem','Tempe',2000,20),('tah','Tahu',1500,20),('say','Sayur',2000,25),('mie','Mie',2500,20),('san','Santan',2000,20),
('kec','Kecap',1000,25),('tep','Tepung',1500,25),('gul','Gula',1000,25),('ken','Kentang',2000,20),
('aya','Ayam',6000,14),('ikn','Ikan',5000,12),('dag','Daging',12000,8),('udg','Udang',10000,8),('kej','Keju',8000,8),('men','Mentega',4000,10),
('sal','Salmon',25000,5),('wag','Wagyu',60000,3),('tru','Truffle',80000,2),('kav','Kaviar',100000,2);

insert into tooldefs values('wajan','Wajan',50000),('panci','Panci',70000),('kukusan','Kukusan',60000),('panggangan','Panggangan',120000),('oven','Oven',150000),('pisau','Pisau Chef',100000),('sous','Sous Vide',300000);

insert into recipes values
(1,'Nasi Goreng','C',14000,'{"ber":1,"tel":1,"min":1,"baw":1}','wajan'),
(2,'Telur Dadar','C',16000,'{"tel":2,"min":1,"baw":1}','wajan'),
(3,'Tempe Goreng','C',14000,'{"tem":2,"min":1,"tep":1}','wajan'),
(4,'Tahu Isi','C',16000,'{"tah":2,"tep":1,"min":1,"cab":1}','wajan'),
(5,'Mie Goreng','C',15000,'{"mie":1,"tel":1,"min":1,"kec":1}','wajan'),
(6,'Pecel','C',18000,'{"say":2,"tem":1,"cab":1,"gul":1}','panci'),
(7,'Sayur Bening','C',14000,'{"say":2,"baw":1,"gul":1}','panci'),
(8,'Perkedel','C',18000,'{"ken":2,"tel":1,"baw":1,"min":1}','wajan'),
(9,'Bubur Polos','C',10000,'{"ber":1,"san":1,"gul":1}','panci'),
(10,'Nasi Uduk','C',11000,'{"ber":1,"san":1,"baw":1}','kukusan'),
(11,'Bakwan','C',17000,'{"say":1,"tep":2,"min":1,"cab":1}','wajan'),
(12,'Tumis Kangkung','C',18000,'{"say":2,"baw":1,"cab":1,"min":1}','wajan'),
(13,'Sambal Goreng Tahu','C',19000,'{"tah":2,"cab":2,"san":1}','panci'),
(14,'Telur Balado','C',20000,'{"tel":2,"cab":2,"baw":1}','wajan'),
(15,'Roti Bakar','C',17000,'{"tep":2,"men":1,"gul":1}','panggangan'),
(16,'Ayam Goreng','B',27000,'{"aya":1,"tep":1,"min":2,"baw":1}','wajan'),
(17,'Ayam Bakar','B',26000,'{"aya":1,"kec":2,"baw":1,"gul":1}','panggangan'),
(18,'Soto Ayam','B',32000,'{"aya":1,"baw":1,"san":1,"say":1,"ber":1}','panci'),
(19,'Ikan Goreng','B',26000,'{"ikn":1,"tep":1,"min":2,"cab":1}','wajan'),
(20,'Ikan Bakar','B',25000,'{"ikn":1,"kec":2,"cab":1,"gul":1}','panggangan'),
(21,'Gulai Ayam','B',33000,'{"aya":1,"san":2,"cab":1,"baw":1}','panci'),
(22,'Bakso','B',40000,'{"dag":1,"tep":1,"mie":1,"baw":1}','panci'),
(23,'Mie Ayam','B',32000,'{"mie":2,"aya":1,"kec":1,"baw":1}','panci'),
(24,'Udang Tepung','B',36000,'{"udg":1,"tep":2,"min":2}','wajan'),
(25,'Capcay','B',35000,'{"say":3,"aya":1,"baw":1,"kec":1}','wajan'),
(26,'Nasgor Seafood','B',36000,'{"ber":1,"udg":1,"tel":1,"min":1}','wajan'),
(27,'Sate Ayam','B',36000,'{"aya":2,"kec":2,"gul":1}','panggangan'),
(28,'Semur Daging','B',38000,'{"dag":1,"kec":2,"baw":1,"gul":1}','panci'),
(29,'Opor Ayam','B',32000,'{"aya":1,"san":2,"baw":2}','panci'),
(30,'Kentang Keju','B',38000,'{"ken":2,"kej":1,"men":1}','oven'),
(31,'Steak Daging','A',75000,'{"dag":2,"men":1,"ken":1,"baw":1}','panggangan'),
(32,'Rendang','A',78000,'{"dag":2,"san":2,"cab":2,"baw":1}','panci'),
(33,'Udang Saus Mentega','A',70000,'{"udg":2,"men":2,"baw":1}','wajan'),
(34,'Lasagna','A',82000,'{"dag":1,"kej":2,"tep":2,"men":1}','oven'),
(35,'Pizza Keju','A',76000,'{"tep":3,"kej":2,"dag":1}','oven'),
(36,'Salmon Panggang','A',75000,'{"sal":1,"men":1,"ken":1}','panggangan'),
(37,'Iga Bakar','A',68000,'{"dag":2,"kec":2,"gul":1}','panggangan'),
(38,'Pasta Carbonara','A',60000,'{"mie":2,"kej":1,"tel":1,"men":1}','panci'),
(39,'Gratin Udang','A',74000,'{"udg":2,"kej":1,"men":1}','oven'),
(40,'Cordon Bleu','A',60000,'{"aya":2,"kej":1,"tep":1,"min":2}','wajan'),
(41,'Tom Yum Seafood','A',56000,'{"udg":1,"ikn":1,"cab":2,"san":1}','panci'),
(42,'Sop Iga','A',66000,'{"dag":2,"ken":1,"baw":1}','panci'),
(43,'Fish and Chips','A',52000,'{"ikn":2,"ken":2,"tep":2,"min":2}','wajan'),
(44,'Burger Daging','A',58000,'{"dag":1,"tep":2,"kej":1}','oven'),
(45,'Paella Udang','A',68000,'{"ber":2,"udg":2,"ikn":1}','panci'),
(46,'Wagyu Steak','S',170000,'{"wag":1,"men":2,"ken":1}','panggangan'),
(47,'Wagyu Truffle','S',330000,'{"wag":1,"tru":1,"men":1}','sous'),
(48,'Salmon Kaviar','S',350000,'{"sal":2,"kav":1,"men":1}','panggangan'),
(49,'Udang Jumbo Truffle','S',260000,'{"udg":3,"tru":1,"men":1}','wajan'),
(50,'Risotto Truffle','S',220000,'{"ber":2,"tru":1,"kej":1,"men":1}','panci'),
(51,'Kaviar Blini','S',240000,'{"kav":1,"tep":2,"men":1}','wajan'),
(52,'Wagyu Sukiyaki','S',160000,'{"wag":1,"tah":1,"say":1,"kec":2}','panci'),
(53,'Salmon Sous Vide','S',300000,'{"sal":2,"men":1,"tru":1}','sous'),
(54,'Wagyu Burger','S',340000,'{"wag":1,"kej":1,"tep":2,"tru":1}','oven'),
(55,'Seafood Platter','S',330000,'{"udg":2,"sal":1,"kav":1}','kukusan'),
(56,'Bisque Udang','S',150000,'{"udg":3,"men":2,"san":1,"kej":1}','panci'),
(57,'Tartare Salmon','S',320000,'{"sal":2,"kav":1}','pisau'),
(58,'Wagyu Carpaccio','S',320000,'{"wag":1,"tru":1,"kej":1}','pisau'),
(59,'Pasta Truffle Udang','S',250000,'{"mie":2,"tru":1,"udg":2,"men":1}','panci'),
(60,'Omakase Kaviar','S',480000,'{"sal":1,"kav":2,"ber":1}','pisau');

-- AKSES BACA
alter table items enable row level security; alter table tooldefs enable row level security;
alter table recipes enable row level security; alter table games enable row level security;
alter table gp enable row level security; alter table inv enable row level security; alter table mk enable row level security;
create policy "b" on items for select to authenticated using(true);
create policy "b" on tooldefs for select to authenticated using(true);
create policy "b" on recipes for select to authenticated using(true);
create policy "b" on games for select to authenticated using(true);
create policy "b" on gp for select to authenticated using(true);
create policy "b" on mk for select to authenticated using(true);
create policy "b" on inv for select to authenticated using(player_id=auth.uid());
grant select on items,tooldefs,recipes,games,gp,inv,mk to authenticated;

-- HARI BARU: event harga, 3 menu, stok pasar diisi ulang
create or replace function new_day(p_room text) returns void language plpgsql security definer set search_path=public as $$
declare r rooms; n int; e int;
 evs text[]:=array['Inflasi naik','Subsidi pemerintah','Bencana banjir','Pajak baru','Panen raya','Harga normal'];
 mus numeric[]:=array[1.3,0.75,1.6,1.2,0.7,1.0];
begin
 select * into r from rooms where id=p_room;
 select count(*) into n from room_players where room_id=p_room;
 if (select day from games where room_id=p_room)>=r.total_days then
  update rooms set status='finished' where id=p_room; return;
 end if;
 e:=1+floor(random()*6)::int;
 update games set day=day+1, day_ends=now()+make_interval(secs=>r.day_duration_sec), mult=mus[e], ev=evs[e],
  menu=array[1+floor(random()*15)::int,16+floor(random()*15)::int,31+floor(random()*15)::int+(case when random()<0.3 then 15 else 0 end)]
 where room_id=p_room;
 delete from mk where room_id=p_room;
 insert into mk select p_room,id,stk*greatest(n,1) from items;
end $$;

create or replace function chk(p_room text) returns games language plpgsql security definer set search_path=public as $$
declare g games;
begin
 select * into g from games where room_id=p_room;
 if g.room_id is null or not exists(select 1 from rooms where id=p_room and status='playing')
  or not exists(select 1 from room_players where room_id=p_room and player_id=auth.uid()) then
  raise exception 'Tidak sedang bermain'; end if;
 if g.day_ends<=now() then raise exception 'Hari berakhir, tunggu hari berikutnya'; end if;
 return g;
end $$;

create or replace function start_game(p_room text) returns void language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from rooms where id=p_room and host_id=auth.uid() and status='waiting') then
  raise exception 'Hanya host yang bisa memulai'; end if;
 update rooms set status='playing' where id=p_room;
 insert into gp select p_room,player_id,500000 from room_players where room_id=p_room;
 insert into games(room_id) values(p_room);
 perform new_day(p_room);
end $$;

create or replace function tick(p_room text) returns void language plpgsql security definer set search_path=public as $$
begin
 perform 1 from games where room_id=p_room and day_ends<=now() for update;
 if found and exists(select 1 from rooms where id=p_room and status='playing') then perform new_day(p_room); end if;
end $$;

-- BELI BAHAN (stok pasar dikunci, siapa cepat dia dapat)
create or replace function buy_item(p_room text,p_item text,p_qty int) returns void language plpgsql security definer set search_path=public as $$
declare g games; s int; c int; i items;
begin
 g:=chk(p_room);
 if p_qty<1 then raise exception 'Jumlah tidak valid'; end if;
 select * into i from items where id=p_item;
 select stock into s from mk where room_id=p_room and item=p_item for update;
 if s<p_qty then raise exception 'Stok % kurang, tersisa %',i.name,s; end if;
 c:=round(i.price*g.mult)*p_qty;
 update gp set money=money-c where room_id=p_room and player_id=auth.uid() and money>=c;
 if not found then raise exception 'Uang tidak cukup'; end if;
 update mk set stock=stock-p_qty where room_id=p_room and item=p_item;
 insert into inv values(p_room,auth.uid(),p_item,p_qty)
  on conflict(room_id,player_id,item) do update set qty=inv.qty+p_qty;
end $$;

-- BELI ALAT BARU (100%) ATAU PERBAIKI (hanya jika kondisi <=50%, hasil 50-75%)
create or replace function buy_tool(p_room text,p_tool text,p_fix boolean) returns void language plpgsql security definer set search_path=public as $$
declare g games; t tooldefs; c int; d int;
begin
 g:=chk(p_room);
 select * into t from tooldefs where id=p_tool;
 c:=round(t.price*(1+(g.mult-1)*0.3));
 if p_fix then
  select qty into d from inv where room_id=p_room and player_id=auth.uid() and item='T:'||p_tool;
  if d is null or d>50 then raise exception 'Alat belum perlu diperbaiki'; end if;
  c:=round(c*0.4); d:=50+floor(random()*26)::int;
 else d:=100; end if;
 update gp set money=money-c where room_id=p_room and player_id=auth.uid() and money>=c;
 if not found then raise exception 'Uang tidak cukup'; end if;
 insert into inv values(p_room,auth.uid(),'T:'||p_tool,d)
  on conflict(room_id,player_id,item) do update set qty=excluded.qty;
end $$;

-- MASAK (bahan berkurang, alat aus 2% per porsi, uang masuk, ada waktu per porsi)
create or replace function cook(p_room text,p_recipe int,p_qty int) returns void language plpgsql security definer set search_path=public as $$
declare g games; r recipes; k text; v int; have int; d int; sec int; me gp;
begin
 g:=chk(p_room);
 select * into r from recipes where id=p_recipe;
 if not (p_recipe=any(g.menu)) then raise exception 'Bukan menu hari ini'; end if;
 if p_qty<1 then raise exception 'Jumlah tidak valid'; end if;
 select * into me from gp where room_id=p_room and player_id=auth.uid() for update;
 if me.busy_until>now() then raise exception 'Masih memasak'; end if;
 select qty into d from inv where room_id=p_room and player_id=auth.uid() and item='T:'||r.tool;
 if coalesce(d,0)<2*p_qty then raise exception 'Kondisi alat % kurang',r.tool; end if;
 for k,v in select key,value::int from jsonb_each_text(r.ing) loop
  select qty into have from inv where room_id=p_room and player_id=auth.uid() and item=k;
  if coalesce(have,0)<v*p_qty then raise exception 'Kurang % %',v*p_qty-coalesce(have,0),k; end if;
 end loop;
 for k,v in select key,value::int from jsonb_each_text(r.ing) loop
  update inv set qty=qty-v*p_qty where room_id=p_room and player_id=auth.uid() and item=k;
 end loop;
 update inv set qty=qty-2*p_qty where room_id=p_room and player_id=auth.uid() and item='T:'||r.tool;
 sec:=(case r.cat when 'C' then 2 when 'B' then 3 when 'A' then 5 else 8 end)*p_qty;
 update gp set money=money+r.price*p_qty, busy_until=now()+make_interval(secs=>sec)
  where room_id=p_room and player_id=auth.uid();
end $$;

revoke execute on function new_day(text),chk(text),start_game(text),tick(text),buy_item(text,text,int),buy_tool(text,text,boolean),cook(text,int,int) from public;
grant execute on function start_game(text),tick(text),buy_item(text,text,int),buy_tool(text,text,boolean),cook(text,int,int) to authenticated;

alter publication supabase_realtime add table games,gp,mk,inv;
