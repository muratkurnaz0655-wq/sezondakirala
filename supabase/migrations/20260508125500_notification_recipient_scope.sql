-- Scope notifications per recipient user.
-- - NULL hedef_kullanici_id: broadcast (admin announcements)
-- - Non-NULL hedef_kullanici_id: only that user can see it

begin;

alter table public.bildirimler
  add column if not exists hedef_kullanici_id uuid references auth.users(id) on delete set null;

create index if not exists idx_bildirimler_hedef_kullanici_id
  on public.bildirimler(hedef_kullanici_id);

-- Best-effort backfill for reservation-linked notifications that already have entity_id.
update public.bildirimler b
set hedef_kullanici_id = r.kullanici_id
from public.rezervasyonlar r
where b.hedef_kullanici_id is null
  and b.entity_tip = 'rezervasyon'
  and b.entity_id is not null
  and r.id::text = b.entity_id;

-- Users can only read broadcast or their own targeted notifications.
drop policy if exists bildirimler_authenticated_select on public.bildirimler;
create policy bildirimler_authenticated_select
on public.bildirimler
for select
to authenticated
using (hedef_kullanici_id is null or hedef_kullanici_id = auth.uid());

-- RPC: authenticated users can mark only visible unread notifications as read.
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
  where okundu = false
    and (hedef_kullanici_id is null or hedef_kullanici_id = auth.uid());

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.mark_all_notifications_read() from public;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- RPC: mark only one visible notification as read.
create or replace function public.mark_notification_read(notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bildirimler
  set okundu = true,
      okundu_tarihi = now()
  where id = notification_id
    and (hedef_kullanici_id is null or hedef_kullanici_id = auth.uid());

  return true;
end;
$$;

revoke all on function public.mark_notification_read(uuid) from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;

commit;
