ALTER TABLE public.ilanlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ilanlar_public_active_select" ON public.ilanlar;
CREATE POLICY "ilanlar_public_active_select"
  ON public.ilanlar
  FOR SELECT
  TO anon, authenticated
  USING (
    aktif = true
  );

DROP POLICY IF EXISTS "ilanlar_owner_select" ON public.ilanlar;
CREATE POLICY "ilanlar_owner_select"
  ON public.ilanlar
  FOR SELECT
  TO authenticated
  USING (
    sahip_id = auth.uid()
  );

DROP POLICY IF EXISTS "admin_tum_ilanlari_gorebilir" ON public.ilanlar;
CREATE POLICY "admin_tum_ilanlari_gorebilir"
  ON public.ilanlar
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.kullanicilar
      WHERE kullanicilar.id = auth.uid()
        AND kullanicilar.rol = 'admin'
    )
  );
