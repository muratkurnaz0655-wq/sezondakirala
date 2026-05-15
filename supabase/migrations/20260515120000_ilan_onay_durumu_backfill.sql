-- Mevcut kayıtlar: yayın durumu ile onay_durumu uyumu
update public.ilanlar
set onay_durumu = 'yayinda'
where aktif = true
  and (onay_durumu is null or onay_durumu = '' or onay_durumu not in ('yayinda', 'onay_bekliyor', 'reddedildi'));

update public.ilanlar
set onay_durumu = 'onay_bekliyor'
where aktif = false
  and (onay_durumu is null or onay_durumu = '' or onay_durumu = 'yayinda');

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ilanlar_onay_durumu_check'
  ) then
    alter table public.ilanlar
      add constraint ilanlar_onay_durumu_check
      check (onay_durumu in ('yayinda', 'onay_bekliyor', 'reddedildi'));
  end if;
end $$;
