import { redirect } from "next/navigation";

/** `/rezervasyon` tek başına dinamik `[slug]` ile eşleşmez; kullanıcıyı aramaya yönlendir */
export default function RezervasyonIndexPage() {
  redirect("/konaklama");
}
