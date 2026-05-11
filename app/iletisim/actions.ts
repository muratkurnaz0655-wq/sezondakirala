"use server";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function mesajGonder(formData: FormData): Promise<void> {
  try {
    const ad = String(formData.get("ad") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const telefon = String(formData.get("telefon") ?? "").trim();
    const konu = String(formData.get("konu") ?? "").trim();
    const mesaj = String(formData.get("mesaj") ?? "").trim();

    if (!ad || !email || !mesaj) {
      throw new Error("Lutfen zorunlu alanlari doldurun.");
    }

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      throw new Error("E-posta servisi su an kullanilamiyor.");
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL;
    const subject = `Yeni İletişim Mesajı — ${ad}`;
    const safe = {
      ad: escapeHtml(ad),
      email: escapeHtml(email),
      telefon: escapeHtml(telefon || "—"),
      konu: escapeHtml(konu || "—"),
      mesaj: escapeHtml(mesaj).replace(/\r?\n/g, "<br/>"),
    };

    await resend.emails.send({
      from,
      to: "info@sezondakirala.com",
      replyTo: email,
      subject,
      html: `
        <p><strong>Ad Soyad:</strong> ${safe.ad}</p>
        <p><strong>E-posta:</strong> ${safe.email}</p>
        <p><strong>Telefon:</strong> ${safe.telefon}</p>
        <p><strong>Konu:</strong> ${safe.konu}</p>
        <p><strong>Mesaj:</strong></p>
        <p>${safe.mesaj}</p>
      `,
      text: [
        `Ad Soyad: ${ad}`,
        `E-posta: ${email}`,
        `Telefon: ${telefon || "-"}`,
        `Konu: ${konu || "-"}`,
        "",
        "Mesaj:",
        mesaj,
      ].join("\n"),
    });
  } catch (e) {
    console.error("[mesajGonder]", e);
    throw new Error("Mesaj gonderilirken bir hata olustu.");
  }
}
