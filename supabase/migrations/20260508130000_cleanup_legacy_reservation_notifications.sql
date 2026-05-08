-- Remove legacy reservation notifications that were not scoped to a user.
-- Keep admin broadcasts (tip='duyuru') and any user-targeted notifications.

begin;

delete from public.bildirimler
where tip = 'yeni_rezervasyon'
  and hedef_kullanici_id is null;

commit;
