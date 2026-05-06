create or replace function public.musait_ilanlar_getir(
  giris date,
  cikis date,
  misafir_sayisi int default null
)
returns setof public.ilanlar
language sql
stable
as $$
  select i.*
  from public.ilanlar i
  where i.aktif = true
    and (misafir_sayisi is null or i.kapasite >= misafir_sayisi)
    and i.id not in (
      select distinct m.ilan_id
      from public.musaitlik m
      where m.tarih >= giris
        and m.tarih < cikis
        and m.durum = 'dolu'
    )
    and i.id not in (
      select distinct r.ilan_id
      from public.rezervasyonlar r
      where r.durum in ('beklemede', 'onaylandi')
        and r.giris_tarihi < cikis
        and r.cikis_tarihi > giris
    );
$$;
