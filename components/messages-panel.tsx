"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MessageRow = {
  id: string;
  icerik: string;
  okundu: boolean;
  olusturulma_tarihi: string;
};

export function MessagesPanel() {
  const [inbox, setInbox] = useState<MessageRow[]>([]);
  const [outbox, setOutbox] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadMessages() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      const [inboxRes, outboxRes] = await Promise.all([
        supabase
          .from("mesajlar")
          .select("id,icerik,okundu,olusturulma_tarihi")
          .eq("alici_id", user.id)
          .order("olusturulma_tarihi", { ascending: false }),
        supabase
          .from("mesajlar")
          .select("id,icerik,okundu,olusturulma_tarihi")
          .eq("gonderen_id", user.id)
          .order("olusturulma_tarihi", { ascending: false }),
      ]);

      if (!isMounted) return;
      setInbox((inboxRes.data ?? []) as MessageRow[]);
      setOutbox((outboxRes.data ?? []) as MessageRow[]);
      setLoading(false);
    }

    void loadMessages();
    const interval = setInterval(() => {
      void loadMessages();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Mesajlar yukleniyor...
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Gelen Kutusu</h2>
        <div className="space-y-2">
          {inbox.map((message) => (
            <article key={message.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="text-slate-700">{message.icerik}</p>
              <p className="mt-1 text-xs text-slate-500">{message.olusturulma_tarihi}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Gonderilenler</h2>
        <div className="space-y-2">
          {outbox.map((message) => (
            <article key={message.id} className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="text-slate-700">{message.icerik}</p>
              <p className="mt-1 text-xs text-slate-500">{message.olusturulma_tarihi}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
