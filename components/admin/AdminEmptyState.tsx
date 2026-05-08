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
    <div className={`rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center ${className}`.trim()}>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <p className="font-medium text-slate-800">{message}</p>
      {actionHref && actionLabel ? (
        <div className="mt-4">
          <AdminActionButton href={actionHref} variant="primary" size="md">
            {actionLabel}
          </AdminActionButton>
        </div>
      ) : null}
    </div>
  );
}
