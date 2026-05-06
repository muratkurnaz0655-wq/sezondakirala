"use client";

type ListingMapProps = {
  label: string;
};

export default function ListingMap({ label }: ListingMapProps) {
  const query = encodeURIComponent(`${label}, Türkiye`);

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">{label}</p>
      <iframe
        src={`https://maps.google.com/maps?q=${query}&z=13&output=embed`}
        width="100%"
        height="320"
        className="w-full rounded-2xl border border-slate-200"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
