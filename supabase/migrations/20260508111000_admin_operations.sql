create table if not exists public.admin_islem_loglari (
  id uuid primary key default gen_random_uuid(),
  tarih timestamptz not null default now(),
  kullanici text not null,
  islem text not null,
  etkilenen_kayit text
);

alter table public.rezervasyonlar
  add column if not exists admin_notu text,
  add column if not exists odeme_durumu text not null default 'beklemede';

alter table public.kullanicilar
  add column if not exists hesap_durumu text not null default 'aktif';
