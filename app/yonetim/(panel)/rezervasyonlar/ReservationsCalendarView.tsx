import { normalizeReservationStatus, STATUS_MAP } from "@/lib/reservation-status";

type CalendarReservation = {
  id: string;
  ilanAdi: string;
  kullaniciAdi: string;
  girisTarihi: string;
  cikisTarihi: string;
  durum: string;
};

const statusBlockClasses: Record<string, string> = {
  onaylandi: "border-emerald-200 bg-emerald-50 text-emerald-800",
  beklemede: "border-amber-200 bg-amber-50 text-amber-800",
  iptal: "border-red-200 bg-red-50 text-red-800",
};

function eachDate(startValue: string, endValue: string) {
  const dates: string[] = [];
  const current = new Date(`${startValue}T00:00:00`);
  const end = new Date(`${endValue}T00:00:00`);
  end.setDate(end.getDate() - 1);
  while (!Number.isNaN(current.getTime()) && current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function ReservationsCalendarView({ reservations }: { reservations: CalendarReservation[] }) {
  const byListing = new Map<string, CalendarReservation[]>();
  reservations.forEach((reservation) => {
    const key = reservation.ilanAdi || "İlan";
    byListing.set(key, [...(byListing.get(key) ?? []), reservation]);
  });

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {[...byListing.entries()].map(([listingName, rows]) => (
        <section key={listingName} className="rounded-xl border border-slate-100 p-3">
          <h3 className="text-sm font-semibold text-slate-900">{listingName}</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((reservation) => {
              const normalized = normalizeReservationStatus(reservation.durum);
              const status = STATUS_MAP[normalized] ?? STATUS_MAP.beklemede;
              const dates = eachDate(reservation.girisTarihi, reservation.cikisTarihi);
              return (
                <div key={reservation.id} className={`rounded-xl border p-3 text-xs ${statusBlockClasses[normalized] ?? statusBlockClasses.beklemede}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{reservation.kullaniciAdi}</span>
                    <span className={`rounded-full border px-2 py-0.5 ${status.color} ${status.bg}`}>{status.label}</span>
                  </div>
                  <p className="mt-2 text-slate-600">
                    {new Date(`${reservation.girisTarihi}T00:00:00`).toLocaleDateString("tr-TR")} -{" "}
                    {new Date(`${reservation.cikisTarihi}T00:00:00`).toLocaleDateString("tr-TR")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dates.slice(0, 10).map((date) => (
                      <span key={date} className="rounded-md bg-white/70 px-1.5 py-0.5 font-medium">
                        {date.slice(8, 10)}.{date.slice(5, 7)}
                      </span>
                    ))}
                    {dates.length > 10 ? <span className="px-1.5 py-0.5">+{dates.length - 10}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
