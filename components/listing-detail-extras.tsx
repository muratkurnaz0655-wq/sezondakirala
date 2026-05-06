"use client";

export function PriceAlertButton() {
  return (
    <button
      type="button"
      className="w-full rounded-xl border-2 border-sky-200 py-3 font-medium text-sky-600 transition-colors hover:bg-sky-50"
      onClick={() => {
        window.alert("Talebiniz alındı. Fiyat düştüğünde sizi bilgilendireceğiz (yakında e-posta ile).");
      }}
    >
      Fiyat düşünce bildir
    </button>
  );
}

export function ListingQuestionForm({ ilanBaslik }: { ilanBaslik: string }) {
  return (
    <div className="border-t border-slate-200 pt-6">
      <h3 className="mb-4 text-lg font-bold text-slate-900">Soru &amp; Cevap</h3>
      <div className="mb-4 rounded-xl bg-slate-50 p-4">
        <textarea
          placeholder="Bu ilan hakkında soru sorun..."
          className="w-full resize-none bg-transparent text-sm focus:outline-none"
          rows={2}
          id="ilan-soru"
        />
        <button
          type="button"
          className="btn-primary mt-2 px-4 py-2 text-sm"
          onClick={() => {
            const el = document.getElementById("ilan-soru") as HTMLTextAreaElement | null;
            const v = el?.value?.trim();
            if (!v) {
              window.alert("Lütfen sorunuzu yazın.");
              return;
            }
            window.alert(`Teşekkürler! "${ilanBaslik}" için sorunuz iletildi (demo).`);
            if (el) el.value = "";
          }}
        >
          Soru Sor
        </button>
      </div>
    </div>
  );
}
