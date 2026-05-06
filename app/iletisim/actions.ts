"use server";

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

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: "info@sezondakirala.com",
      subject: `Iletisim Formu — ${ad}`,
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

  } catch {
    throw new Error("Mesaj gonderilirken bir hata olustu.");
  }
}
