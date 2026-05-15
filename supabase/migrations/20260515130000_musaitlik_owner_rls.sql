-- İlan sahibi kendi ilanının müsaitlik kayıtlarını yönetebilir
alter table public.musaitlik enable row level security;

drop policy if exists musaitlik_owner_select on public.musaitlik;
drop policy if exists musaitlik_owner_insert on public.musaitlik;
drop policy if exists musaitlik_owner_update on public.musaitlik;
drop policy if exists musaitlik_owner_delete on public.musaitlik;

create policy musaitlik_owner_select on public.musaitlik
  for select
  using (
    exists (
      select 1 from public.ilanlar i
      where i.id = musaitlik.ilan_id and i.sahip_id = auth.uid()
    )
  );

create policy musaitlik_owner_insert on public.musaitlik
  for insert
  with check (
    exists (
      select 1 from public.ilanlar i
      where i.id = musaitlik.ilan_id and i.sahip_id = auth.uid()
    )
  );

create policy musaitlik_owner_update on public.musaitlik
  for update
  using (
    exists (
      select 1 from public.ilanlar i
      where i.id = musaitlik.ilan_id and i.sahip_id = auth.uid()
    )
  );

create policy musaitlik_owner_delete on public.musaitlik
  for delete
  using (
    exists (
      select 1 from public.ilanlar i
      where i.id = musaitlik.ilan_id and i.sahip_id = auth.uid()
    )
  );
