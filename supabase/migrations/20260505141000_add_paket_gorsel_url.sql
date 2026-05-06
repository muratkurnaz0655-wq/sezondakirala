-- Paket kart/hero görselini saklamak için URL alanı.
-- Daha önce kod tarafında kullanılan `gorsel_url` kolonu bazı ortamlarda yoktu.
alter table if exists public.paketler
add column if not exists gorsel_url text;

comment on column public.paketler.gorsel_url
is 'Paket kapak görseli public URL (opsiyonel).';
