-- Idempotent: some environments never applied recipient-scope migration.
alter table public.bildirimler
  add column if not exists hedef_kullanici_id uuid references auth.users(id) on delete set null;

create index if not exists idx_bildirimler_hedef_kullanici_id
  on public.bildirimler(hedef_kullanici_id);

notify pgrst, 'reload schema';
