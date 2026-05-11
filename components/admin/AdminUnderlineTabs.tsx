import Link from "next/link";

export type AdminUnderlineTabItem = {
  key: string;
  label: string;
  href: string;
};

/** Alt çizgili hızlı sekmeler (rezervasyonlar vb.) */
export function AdminUnderlineTabs({ items, activeKey }: { items: AdminUnderlineTabItem[]; activeKey: string | null }) {
  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-2 border-b border-[#E2E8F0]">
      {items.map((item) => {
        const active = activeKey === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`border-b-2 pb-2.5 text-sm font-medium transition-colors duration-150 ${
              active
                ? "border-[#185FA5] text-[#185FA5]"
                : "border-transparent text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
