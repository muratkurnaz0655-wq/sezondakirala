create table if not exists public.paket_medyalari (
  id uuid primary key default gen_random_uuid(),
  paket_id uuid not null references public.paketler(id) on delete cascade,
  url text not null,
  tip text not null check (tip in ('kapak', 'detay')),
  sira integer not null default 1,
  olusturulma_tarihi timestamptz not null default now()
);

create index if not exists idx_paket_medyalari_paket_id on public.paket_medyalari(paket_id);
create index if not exists idx_paket_medyalari_tip_sira on public.paket_medyalari(paket_id, tip, sira);
