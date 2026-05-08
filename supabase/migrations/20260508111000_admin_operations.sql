create table if not exists public.admin_loglar (
  id uuid primary key default gen_random_uuid(),
  olusturulma_tarihi timestamptz not null default now(),
  kullanici_id uuid,
  kullanici_email text,
  islem text not null,
  entity_tip text,
  entity_id text,
  entity_baslik text,
  detaylar jsonb
);

create table if not exists public.bildirimler (
  id uuid primary key default gen_random_uuid(),
  olusturulma_tarihi timestamptz not null default now(),
  tip text not null default 'bilgi',
  baslik text,
  mesaj text,
  entity_tip text,
  entity_id text,
  okundu boolean not null default false,
  okundu_tarihi timestamptz
);

create table if not exists public.bildirim_tercihleri (
  id uuid primary key default gen_random_uuid(),
  guncelleme_tarihi timestamptz not null default now(),
  yeni_rezervasyonda_bildir boolean not null default true,
  yeni_kullanicida_bildir boolean not null default true,
  beklemede_24saat_bildir boolean not null default true,
  iptal_edildiginde_bildir boolean not null default true
);

alter table public.rezervasyonlar
  add column if not exists admin_notu text,
  add column if not exists admin_notu_tarihi timestamptz,
  add column if not exists admin_notu_kullanici_id uuid,
  add column if not exists odeme_durumu text not null default 'pending';

alter table public.ilanlar
  add column if not exists onay_durumu text not null default 'onay_bekliyor';

alter table public.kullanicilar
  add column if not exists hesap_durumu text not null default 'aktif';
