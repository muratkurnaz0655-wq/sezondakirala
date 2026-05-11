/** Sunucu + istemci güvenli saf fonksiyon (client modülünde tanımlanmamalı). */

export function listingCoverImageUrl(
  medias: { url: string; sira: number }[] | null | undefined,
): string | null {
  if (!Array.isArray(medias) || medias.length === 0) return null;
  const sorted = [...medias].sort((a, b) => (Number(a.sira) || 0) - (Number(b.sira) || 0));
  const siraBir = sorted.find((m) => Number(m.sira) === 1);
  return (siraBir ?? sorted[0])?.url ?? null;
}
