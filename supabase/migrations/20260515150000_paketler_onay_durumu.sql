-- Paketler: ilanlar ile aynı yayın / onay modeli

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

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'paketler_onay_durumu_check'
  ) then
    alter table public.paketler
      add constraint paketler_onay_durumu_check
      check (onay_durumu in ('yayinda', 'onay_bekliyor', 'reddedildi'));
  end if;
end $$;

alter table public.paketler enable row level security;

drop policy if exists "paketler_public_active_select" on public.paketler;
create policy "paketler_public_active_select"
  on public.paketler
  for select
  to anon, authenticated
  using (
    aktif = true
    and onay_durumu = 'yayinda'
  );
