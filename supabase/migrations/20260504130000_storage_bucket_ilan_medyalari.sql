-- İlan (ve profil avatarı) medyaları için public Storage kovası + RLS.
-- Supabase SQL Editor veya `supabase db push` ile uygulayın.

INSERT INTO storage.buckets (id, name, public)
VALUES ('ilan-medyalari', 'ilan-medyalari', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ilan_medyalari_objects_select" ON storage.objects;
CREATE POLICY "ilan_medyalari_objects_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'ilan-medyalari');

DROP POLICY IF EXISTS "ilan_medyalari_objects_insert" ON storage.objects;
CREATE POLICY "ilan_medyalari_objects_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ilan-medyalari');

DROP POLICY IF EXISTS "ilan_medyalari_objects_update" ON storage.objects;
CREATE POLICY "ilan_medyalari_objects_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ilan-medyalari')
WITH CHECK (bucket_id = 'ilan-medyalari');

DROP POLICY IF EXISTS "ilan_medyalari_objects_delete" ON storage.objects;
CREATE POLICY "ilan_medyalari_objects_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ilan-medyalari');
