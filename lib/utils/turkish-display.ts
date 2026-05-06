/**
 * Veritabanı veya eski içeriklerde kalan ASCII yazımları arayüzde düzgün Türkçe gösterir.
 * URL slug'ları veya kod anahtarları (ör. luks, ozel_fiyat) için kullanmayın.
 */
export function fixTurkishDisplay(value: string | null | undefined): string {
  if (!value) return "";
  let s = value;
  const pairs: [RegExp, string][] = [
    [/Dogayla\s+Ice\s+Tatil/gi, "Doğayla İçe İçe Tatil"],
    [/Dogayla/gi, "Doğayla"],
    [/Ice Ice/g, "İçe İçe"],
    [/Sezonda\s+Kirala/gi, "Sezondakirala"],
    [/SezondalKirala/g, "Sezondakirala"],
    [/Oludeniz/g, "Ölüdeniz"],
    [/Gocekteki/gi, "Göcekteki"],
    [/Calistaki/gi, "Çalıştaki"],
    [/Hisaronunde/gi, "Hisarönünde"],
    [/Calis/g, "Çalış"],
    [/Gocek/g, "Göcek"],
    [/Hisaronu/g, "Hisarönü"],
    [/Kayakoy/g, "Kayaköy"],
    [/\bDoga\b/gi, "Doğa"],
    [/\bIcinde\b/gi, "İçinde"],
    [/\bTas\b/gi, "Taş"],
    [/tas\s+evinde/gi, "taş evinde"],
    [/\bLuks\b/g, "Lüks"],
    [/Muhtesem/gi, "Muhteşem"],
    [/Balayi/gi, "Balayı"],
    [/essizdi/gi, "eşsizdi"],
    [/\bOzel\s+Gulet\b/gi, "Özel Gulet"],
    [/\bGulet\b/g, "Gulet"],
    [/\bgulet\b/g, "gulet"],
    [/Kacamak/g, "Kaçamak"],
    [/\bIce\b/g, "İçe"],
    [/\bMusait\b/g, "Müsait"],
    [/\bmusait\b/g, "müsait"],
    [/\bOzel\b/g, "Özel"],
  ];
  for (const [re, to] of pairs) s = s.replace(re, to);
  return s;
}
