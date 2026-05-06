-- Kullanıcı kendi satırında rol dahil güncelleme yapabilsin (İlan sahibi ol).
-- Supabase SQL Editor'da bir kez çalıştırın. Mevcut UPDATE policy ile çakışırsa önce eskisini kaldırın.

ALTER TABLE public.kullanicilar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kullanici_kendi_profilini_guncelleyebilir" ON public.kullanicilar;

CREATE POLICY "kullanici_kendi_profilini_guncelleyebilir" ON public.kullanicilar
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
