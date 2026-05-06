-- Rezervasyon durumlarını tek standarda çek:
-- beklemede | onaylandi | iptal

UPDATE public.rezervasyonlar
SET durum = CASE
  WHEN lower(trim(durum)) IN ('pending', 'onay_bekliyor', 'odeme_bekleniyor', 'beklemede') THEN 'beklemede'
  WHEN lower(trim(durum)) IN ('approved', 'onaylandi') THEN 'onaylandi'
  WHEN lower(trim(durum)) IN ('rejected', 'cancelled', 'reddedildi', 'iptal') THEN 'iptal'
  ELSE 'beklemede'
END;

ALTER TABLE public.rezervasyonlar
  ALTER COLUMN durum SET DEFAULT 'beklemede';

ALTER TABLE public.rezervasyonlar
  DROP CONSTRAINT IF EXISTS rezervasyonlar_durum_check;

ALTER TABLE public.rezervasyonlar
  ADD CONSTRAINT rezervasyonlar_durum_check
  CHECK (durum IN ('beklemede', 'onaylandi', 'iptal'));
