-- İlan detay yorumları: yalnızca ilgili ilan + kullanıcı bilgisi (embed/RLS sorunlarına karşı)
CREATE OR REPLACE FUNCTION public.get_ilan_yorumlari(p_ilan_id uuid)
RETURNS TABLE (
  id uuid,
  rezervasyon_id uuid,
  kullanici_id uuid,
  ilan_id uuid,
  puan integer,
  yorum text,
  olusturulma_tarihi timestamptz,
  ad_soyad text,
  email text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    y.id,
    y.rezervasyon_id,
    y.kullanici_id,
    y.ilan_id,
    y.puan::integer,
    y.yorum::text,
    y.olusturulma_tarihi,
    k.ad_soyad::text,
    k.email::text,
    k.avatar_url::text
  FROM public.yorumlar y
  INNER JOIN public.kullanicilar k ON k.id = y.kullanici_id
  WHERE y.ilan_id = p_ilan_id
  ORDER BY y.olusturulma_tarihi DESC;
$$;

REVOKE ALL ON FUNCTION public.get_ilan_yorumlari(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ilan_yorumlari(uuid) TO anon, authenticated;
