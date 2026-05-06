import Link from "next/link";

const adminLinks = [
  { href: "/yonetim", label: "Dashboard" },
  { href: "/yonetim/ilanlar", label: "İlanlar" },
  { href: "/yonetim/paketler", label: "Paketler" },
  { href: "/yonetim/kullanicilar", label: "Kullanıcılar" },
  { href: "/yonetim/rezervasyonlar", label: "Rezervasyonlar" },
  { href: "/yonetim/ayarlar", label: "Ayarlar" },
];

export function AdminNav() {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Admin Paneli</h2>
      <nav className="flex flex-col gap-2">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
