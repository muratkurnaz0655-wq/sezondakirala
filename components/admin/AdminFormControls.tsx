import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const fieldLabelClass =
  "mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#64748B]";
const controlClass =
  "w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#1E293B] transition-all placeholder:text-[#94A3B8] focus:border-[#185FA5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#185FA5]/20";

type AdminFormFieldProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function AdminFormField({ label, children, className = "" }: AdminFormFieldProps) {
  return (
    <div className={className}>
      <label className={fieldLabelClass}>{label}</label>
      {children}
    </div>
  );
}

export function AdminInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${controlClass} ${className}`.trim()} />;
}

export function AdminSelect({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${controlClass} cursor-pointer ${className}`.trim()} />;
}
