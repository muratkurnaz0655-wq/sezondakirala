export default function MesajlarPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">💬</div>
      <h2 className="mb-2 text-lg font-semibold text-slate-800">Mesajlaşma Yakında</h2>
      <p className="mb-6 max-w-xs text-sm text-slate-500">
        Şu an için sorularınız için WhatsApp hattımızdan bize ulaşabilirsiniz.
      </p>
      <a
        href="https://wa.me/905324251000"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-600"
      >
        WhatsApp ile Yaz
      </a>
    </div>
  );
}
