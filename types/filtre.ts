export interface VillaFiltre {
  bolge: string[];
  minFiyat: number;
  maxFiyat: number;
  minKisi: number;
  maxKisi: number;
  minYatakOdasi: number;
  maxYatakOdasi: number;
  minBanyo: number;
  kategori: string[];
  ozellikler: string[];
  siralama: "onerilen" | "fiyat_artan" | "fiyat_azalan" | "yeni_eklenen" | "kapasite_buyuk";
}

export const defaultFiltre: VillaFiltre = {
  bolge: [],
  minFiyat: 0,
  maxFiyat: 20000,
  minKisi: 1,
  maxKisi: 20,
  minYatakOdasi: 1,
  maxYatakOdasi: 10,
  minBanyo: 1,
  kategori: [],
  ozellikler: [],
  siralama: "onerilen",
};
