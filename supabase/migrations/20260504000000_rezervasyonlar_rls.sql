-- Rezervasyonlar: oturum açmış kullanıcı yalnızca kendi satırlarını okuyup yazabilir.
-- Uygulama tarayıcıda anon key + kullanıcı JWT ile insert/select/update için gerekli.

ALTER TABLE public.rezervasyonlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kullanici_rezervasyon_olusturabilir" ON public.rezervasyonlar;
DROP POLICY IF EXISTS "kullanici_kendi_rezervasyonlarini_gorur" ON public.rezervasyonlar;
DROP POLICY IF EXISTS "kullanici_kendi_rezervasyonunu_guncelleyebilir" ON public.rezervasyonlar;

CREATE POLICY "kullanici_rezervasyon_olusturabilir" ON public.rezervasyonlar
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = kullanici_id);

CREATE POLICY "kullanici_kendi_rezervasyonlarini_gorur" ON public.rezervasyonlar
  FOR SELECT
  TO authenticated
  USING (auth.uid() = kullanici_id);

CREATE POLICY "kullanici_kendi_rezervasyonunu_guncelleyebilir" ON public.rezervasyonlar
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = kullanici_id);
