import Link from "next/link";

type TabItem = {
  key: string;
  label: string;
  href: string;
};

export function AdminSegmentedTabs({ items, activeKey }: { items: TabItem[]; activeKey: string }) {
  return (
    <nav className="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`px-4 py-1.5 text-sm font-medium transition-all ${
            activeKey === item.key
              ? "rounded-lg bg-white text-slate-800 shadow-sm"
              : "rounded-lg text-slate-500 hover:text-slate-700"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
