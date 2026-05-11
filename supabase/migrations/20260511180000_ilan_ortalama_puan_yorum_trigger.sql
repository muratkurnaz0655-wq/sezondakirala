-- İlan ortalama puanı: yorumlar tablosu INSERT/UPDATE/DELETE sonrası ilanlar.ortalama_puan ve ilanlar.yorum_sayisi güncellenir.
-- Supabase SQL Editor'da veya migration olarak çalıştırın.
-- Önkoşul: public.ilanlar tablosunda aşağıdaki kolonlar yoksa ekleyin.

ALTER TABLE public.ilanlar
  ADD COLUMN IF NOT EXISTS ortalama_puan numeric(4,2),
  ADD COLUMN IF NOT EXISTS yorum_sayisi integer NOT NULL DEFAULT 0;

-- Aynı kullanıcı aynı ilana tek yorum (uygulama tarafında da kontrol var)
CREATE UNIQUE INDEX IF NOT EXISTS yorumlar_ilan_id_kullanici_id_key
  ON public.yorumlar (ilan_id, kullanici_id);

CREATE OR REPLACE FUNCTION public.refresh_ilan_yorum_ozeti(p_ilan_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt integer;
  ort double precision;
BEGIN
  SELECT COUNT(*)::integer, AVG(y.puan::double precision)
  INTO cnt, ort
  FROM public.yorumlar y
  WHERE y.ilan_id = p_ilan_id;

  UPDATE public.ilanlar
  SET
    yorum_sayisi = COALESCE(cnt, 0),
    ortalama_puan = CASE WHEN COALESCE(cnt, 0) = 0 THEN NULL ELSE ROUND(ort::numeric, 2) END
  WHERE id = p_ilan_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_yorumlar_refresh_ilan_ozeti()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target := OLD.ilan_id;
  ELSE
    target := NEW.ilan_id;
  END IF;

  PERFORM public.refresh_ilan_yorum_ozeti(target);

  IF TG_OP = 'UPDATE' AND NEW.ilan_id IS DISTINCT FROM OLD.ilan_id THEN
    PERFORM public.refresh_ilan_yorum_ozeti(OLD.ilan_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS yorumlar_refresh_ilan_ozeti ON public.yorumlar;
CREATE TRIGGER yorumlar_refresh_ilan_ozeti
  AFTER INSERT OR UPDATE OR DELETE ON public.yorumlar
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_yorumlar_refresh_ilan_ozeti();

-- Mevcut verileri bir kez hizala (opsiyonel)
UPDATE public.ilanlar i
SET
  yorum_sayisi = COALESCE(s.cnt, 0),
  ortalama_puan = CASE WHEN COALESCE(s.cnt, 0) = 0 THEN NULL ELSE ROUND(s.ort::numeric, 2) END
FROM (
  SELECT y.ilan_id, COUNT(*)::integer AS cnt, AVG(y.puan::double precision) AS ort
  FROM public.yorumlar y
  GROUP BY y.ilan_id
) s
WHERE i.id = s.ilan_id;
