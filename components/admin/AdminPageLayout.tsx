import type { ReactNode } from "react";
import { AdminPageMountFade } from "@/components/admin/AdminPageMountFade";

type AdminPageLayoutProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageLayout({ title, description, actions, children }: AdminPageLayoutProps) {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-[#1E293B]">{title}</h1>
          {description ? <p className="mt-1 text-sm leading-relaxed text-[#64748B]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <AdminPageMountFade>{children}</AdminPageMountFade>
    </div>
  );
}
