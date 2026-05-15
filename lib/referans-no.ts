const REFERANS_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Yeni rezervasyonlar için: SZK- + 5 haneli alfanumerik (0,1,I,O hariç) */
export function generateReferansNo(): string {
  const buf = new Uint8Array(5);
  crypto.getRandomValues(buf);
  const suffix = Array.from(buf, (b) => REFERANS_CHARS[b % REFERANS_CHARS.length]!).join("");
  return `SZK-${suffix}`;
}
