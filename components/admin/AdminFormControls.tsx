import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type AdminFormFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function AdminFormField({ label, children, className = "" }: AdminFormFieldProps) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}

export function AdminInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 transition-all placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`.trim()}
    />
  );
}

export function AdminSelect({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`.trim()}
    />
  );
}
