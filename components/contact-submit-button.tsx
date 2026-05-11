"use client";

import { useFormStatus } from "react-dom";

export function ContactSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded-xl bg-gradient-to-r from-[#0e9aa7] to-[#22d3ee] px-5 py-2.5 text-sm font-bold text-[#0d1117] transition-all hover:from-[#22d3ee] hover:to-[#0e9aa7] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? <span className="inline-spinner inline-block align-middle" aria-hidden /> : "Mesaj Gönder"}
    </button>
  );
}
