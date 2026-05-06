import Link from "next/link";
import { X } from "lucide-react";

export type KonaklamaFilterChip = { id: string; label: string; href: string };

export function KonaklamaActiveFilterChips({ chips }: { chips: KonaklamaFilterChip[] }) {
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700"
        >
          <span>{c.label}</span>
          <Link
            href={c.href}
            scroll={false}
            className="rounded-full p-0.5 text-sky-800 hover:bg-sky-200"
            aria-label={`${c.label} filtresini kaldır`}
          >
            <X size={12} strokeWidth={2.5} />
          </Link>
        </span>
      ))}
    </div>
  );
}
