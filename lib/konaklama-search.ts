export type KonaklamaQueryParams = {
  giris?: string;
  cikis?: string;
  konum?: string;
  konumSecim?: string;
  minFiyat?: string;
  maxFiyat?: string;
  kapasite?: string;
  yatakOdasi?: string;
  sirala?: string;
  ozellikler?: string | string[];
  yetiskin?: string;
  cocuk?: string;
  bebek?: string;
  misafir?: string;
  ozel?: string | string[];
  /** liste (varsayılan) URL’de yok; harita için `harita` */
  goruntu?: string;
};

export function normalizeOzelParam(ozel?: string | string[]): string[] {
  if (!ozel) return [];
  return Array.isArray(ozel) ? ozel : [ozel];
}

export function buildKonaklamaQuery(
  params: KonaklamaQueryParams,
  overrides: { page?: string; sayfa?: string } = {},
): string {
  const q = new URLSearchParams();
  const set = (k: string, v?: string) => {
    if (v !== undefined && v !== null && v !== "") q.set(k, v);
  };
  set("giris", params.giris);
  set("cikis", params.cikis);
  set("konum", params.konum || params.konumSecim);
  set("minFiyat", params.minFiyat);
  set("maxFiyat", params.maxFiyat);
  set("kapasite", params.kapasite);
  set("yatakOdasi", params.yatakOdasi);
  set("sirala", params.sirala);
  set("yetiskin", params.yetiskin);
  set("cocuk", params.cocuk);
  set("bebek", params.bebek);
  set("misafir", params.misafir);
  if (params.goruntu === "harita") {
    set("goruntu", "harita");
  }
  const feats = Array.isArray(params.ozellikler)
    ? params.ozellikler
    : params.ozellikler
      ? [params.ozellikler]
      : [];
  feats.forEach((f) => q.append("ozellikler", f));
  normalizeOzelParam(params.ozel).forEach((o) => q.append("ozel", o));
  const page = overrides.page ?? overrides.sayfa;
  if (page && page !== "1") q.set("page", page);
  const s = q.toString();
  return s ? `?${s}` : "";
}
