-- Ensure mark-read RPCs resolve the caller uid reliably inside SECURITY DEFINER
-- (avoids updates matching zero rows when auth.uid() is null in the definer context).
-- mark_notification_read now returns false when no row was updated.

begin;

create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
  uid uuid;
begin
  uid := coalesce(
    auth.uid(),
    nullif(trim(current_setting('request.jwt.claim.sub', true)), '')::uuid
  );

  if uid is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.bildirimler
  set okundu = true,
      okundu_tarihi = now()
  where okundu = false
    and (hedef_kullanici_id is null or hedef_kullanici_id = uid);

  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.mark_notification_read(notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
  uid uuid;
begin
  uid := coalesce(
    auth.uid(),
    nullif(trim(current_setting('request.jwt.claim.sub', true)), '')::uuid
  );

  if uid is null then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.bildirimler
  set okundu = true,
      okundu_tarihi = now()
  where id = notification_id
    and (hedef_kullanici_id is null or hedef_kullanici_id = uid);

  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

commit;
