-- Tek satırlı platform ayarları (uygulama: getPlatformSettings + yonetim/ayarlar)
-- Supabase SQL Editor'da ihtiyaca göre çalıştırın.

CREATE TABLE IF NOT EXISTS public.ayarlar (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tursab_no text DEFAULT '14382',
  whatsapp_number text DEFAULT '905324251000',
  komisyon_orani numeric DEFAULT 0.10,
  site_adi text DEFAULT 'Sezondakirala',
  site_slogan text DEFAULT 'Fethiye''nin tatil platformu',
  iletisim_email text DEFAULT 'info@sezondakirala.com',
  iletisim_telefon text DEFAULT '+90 532 425 10 00',
  olusturulma_tarihi timestamptz DEFAULT now()
);

ALTER TABLE public.ayarlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ayarlar_herkese_okunur" ON public.ayarlar;
CREATE POLICY "ayarlar_herkese_okunur" ON public.ayarlar FOR SELECT USING (true);

-- İlk satır (tablo boşsa)
INSERT INTO public.ayarlar (tursab_no, whatsapp_number, komisyon_orani)
SELECT '14382', '905324251000', 0.10
WHERE NOT EXISTS (SELECT 1 FROM public.ayarlar LIMIT 1);
