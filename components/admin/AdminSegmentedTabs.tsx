import Link from "next/link";

type TabItem = {
  key: string;
  label: string;
  href: string;
};

type Appearance = "rail" | "pills";

/**
 * `pills`: İlanlar / paketler sekmeleri — aktif mavi dolgu.
 * `rail`: Açık gri şerit üzerinde beyaz pill (eski segmented görünüm).
 */
export function AdminSegmentedTabs({
  items,
  activeKey,
  appearance = "pills",
  className = "",
}: {
  items: TabItem[];
  activeKey: string;
  appearance?: Appearance;
  className?: string;
}) {
  if (appearance === "rail") {
    return (
      <nav className={`flex w-full gap-1 overflow-x-auto rounded-xl bg-[#F1F5F9] p-1 ${className}`.trim()}>
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
              activeKey === item.key
                ? "bg-white text-[#1E293B] shadow-sm"
                : "text-[#64748B] hover:text-[#1E293B]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className={`flex w-full flex-wrap gap-2 ${className}`.trim()}>
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 ${
            activeKey === item.key
              ? "border-transparent bg-[#185FA5] text-white shadow-sm"
              : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1] hover:text-[#1E293B]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
