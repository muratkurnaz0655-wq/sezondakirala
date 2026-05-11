import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { AdminActionButton } from "./AdminActionButton";

type AdminEmptyStateProps = {
  message?: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
  className?: string;
};

export function AdminEmptyState({
  message = "Henüz kayıt yok",
  actionHref,
  actionLabel,
  icon,
  className = "",
}: AdminEmptyStateProps) {
  return (
    <div className={`rounded-xl border border-dashed border-[#E2E8F0] bg-white px-5 py-12 text-center ${className}`.trim()}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-[#94A3B8]">
        {icon ?? <Inbox className="h-12 w-12" strokeWidth={1.25} aria-hidden />}
      </div>
      <p className="text-base font-medium text-[#64748B]">{message}</p>
      {actionHref && actionLabel ? (
        <div className="mt-5">
          <AdminActionButton href={actionHref} variant="primary" size="md">
            {actionLabel}
          </AdminActionButton>
        </div>
      ) : null}
    </div>
  );
}
