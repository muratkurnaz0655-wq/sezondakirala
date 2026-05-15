-- Yayın tutarlılığı: sitede yalnızca onaylı (yayında) ilanlar görünsün.
-- aktif=true iken onay_bekliyor kalan kayıtlar (eski onay akışı) yayına alınır.

update public.ilanlar
set onay_durumu = 'yayinda'
where aktif = true
  and onay_durumu = 'onay_bekliyor';

update public.ilanlar
set onay_durumu = 'onay_bekliyor'
where aktif = false
  and onay_durumu = 'yayinda';

drop policy if exists "ilanlar_public_active_select" on public.ilanlar;
create policy "ilanlar_public_active_select"
  on public.ilanlar
  for select
  to anon, authenticated
  using (
    aktif = true
    and onay_durumu = 'yayinda'
  );
