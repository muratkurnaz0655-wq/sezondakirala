"use client";

import Link from "next/link";
import { Award, Mountain, Star, Users, type LucideIcon } from "lucide-react";

export type HomeKategoriFiltreItem = {
  title: string;
  subtitle: string;
  href: string;
  image: string;
  icon: "mountain" | "award" | "star" | "users";
};

const ICONS: Record<HomeKategoriFiltreItem["icon"], LucideIcon> = {
  mountain: Mountain,
  award: Award,
  star: Star,
  users: Users,
};

type HomeKategoriFiltreProps = {
  items: HomeKategoriFiltreItem[];
};

export function HomeKategoriFiltre({ items }: HomeKategoriFiltreProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.title}
            href={item.href}
            className="group relative overflow-hidden rounded-2xl bg-slate-200 p-6 text-white"
            style={{
              backgroundImage: `url('${item.image}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="relative z-10 flex min-h-52 flex-col justify-between">
              <div>
                <Icon className="icon-lg" />
                <h3 className="mt-2 text-xl font-bold text-white drop-shadow-lg">{item.title}</h3>
                <p className="mt-1 text-sm text-white/80">{item.subtitle}</p>
              </div>
              <span className="inline-flex w-fit translate-y-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                İncele →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
