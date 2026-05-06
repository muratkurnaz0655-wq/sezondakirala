-- ilan_medyalari: katalog okumasi + ilan sahibinin kendi ilanina medya eklemesi/silmesi.
-- Storage yuklemesi basarili olsa bile INSERT RLS yoksa kayit dusmez; createListing bu durumda hata verir.

ALTER TABLE public.ilan_medyalari ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ilan_medyalari_public_select" ON public.ilan_medyalari;
CREATE POLICY "ilan_medyalari_public_select"
  ON public.ilan_medyalari FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "ilan_medyalari_owner_insert" ON public.ilan_medyalari;
CREATE POLICY "ilan_medyalari_owner_insert"
  ON public.ilan_medyalari FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ilanlar
      WHERE ilanlar.id = ilan_medyalari.ilan_id
        AND ilanlar.sahip_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "ilan_medyalari_owner_delete" ON public.ilan_medyalari;
CREATE POLICY "ilan_medyalari_owner_delete"
  ON public.ilan_medyalari FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ilanlar
      WHERE ilanlar.id = ilan_medyalari.ilan_id
        AND ilanlar.sahip_id = auth.uid()
    )
  );
