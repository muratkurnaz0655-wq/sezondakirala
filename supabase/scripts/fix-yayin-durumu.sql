-- Supabase SQL Editor'da tek seferde çalıştırın.
-- İlan ve paketlerin sitede görünmesi için onay_durumu + RLS uyumu.

-- === İLANLAR ===
update public.ilanlar
set onay_durumu = 'yayinda'
where aktif = true
  and (onay_durumu is null or onay_durumu = '' or onay_durumu = 'onay_bekliyor');

update public.ilanlar
set onay_durumu = 'onay_bekliyor'
where aktif = false
  and onay_durumu = 'yayinda';

drop policy if exists "ilanlar_public_active_select" on public.ilanlar;
create policy "ilanlar_public_active_select"
  on public.ilanlar
  for select
  to anon, authenticated
  using (aktif = true and onay_durumu = 'yayinda');

-- === PAKETLER ===
alter table public.paketler
  add column if not exists onay_durumu text not null default 'onay_bekliyor';

update public.paketler
set onay_durumu = 'yayinda'
where aktif = true
  and (onay_durumu is null or onay_durumu = '' or onay_durumu = 'onay_bekliyor');

update public.paketler
set onay_durumu = 'onay_bekliyor'
where aktif = false
  and onay_durumu = 'yayinda';

alter table public.paketler enable row level security;

drop policy if exists "paketler_public_active_select" on public.paketler;
create policy "paketler_public_active_select"
  on public.paketler
  for select
  to anon, authenticated
  using (aktif = true and onay_durumu = 'yayinda');

-- === Teşhis (sonuçları kontrol edin) ===
select 'ilanlar' as tablo, onay_durumu, aktif, count(*) as adet
from public.ilanlar
group by 1, 2, 3
order by 2, 3;

select 'paketler' as tablo, onay_durumu, aktif, count(*) as adet
from public.paketler
group by 1, 2, 3
order by 2, 3;

select id, baslik, aktif, onay_durumu, tip
from public.ilanlar
where aktif = true
order by olusturulma_tarihi desc nulls last
limit 20;

select id, baslik, aktif, onay_durumu
from public.paketler
where aktif = true
order by olusturulma_tarihi desc nulls last
limit 20;
