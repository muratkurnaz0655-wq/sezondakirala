-- Secure notification read flow for authenticated users.
-- Users should not update bildirimler rows directly; only mark as read via RPC.

begin;

alter table public.bildirimler enable row level security;

-- Keep read access for authenticated users.
drop policy if exists bildirimler_authenticated_select on public.bildirimler;
create policy bildirimler_authenticated_select
on public.bildirimler
for select
to authenticated
using (true);

-- Remove direct row updates from authenticated users.
drop policy if exists bildirimler_authenticated_update on public.bildirimler;

-- Admin full access policy (idempotent).
drop policy if exists bildirimler_admin_all on public.bildirimler;
drop policy if exists bildirimler_sadece_admin on public.bildirimler;
create policy bildirimler_admin_all
on public.bildirimler
for all
to public
using (
  exists (
    select 1
    from public.kullanicilar k
    where k.id = auth.uid()
      and k.rol = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.kullanicilar k
    where k.id = auth.uid()
      and k.rol = 'admin'
  )
);

-- RPC: authenticated users can mark all unread notifications as read.
create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
begin
  update public.bildirimler
  set okundu = true,
      okundu_tarihi = now()
  where okundu = false;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.mark_all_notifications_read() from public;
grant execute on function public.mark_all_notifications_read() to authenticated;

commit;
