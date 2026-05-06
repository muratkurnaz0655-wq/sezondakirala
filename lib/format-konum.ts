function cleanPart(part?: string | null): string[] {
  if (!part) return [];
  return part
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function formatKonum(
  mahalle?: string | null,
  ilce?: string | null,
  il?: string | null,
): string {
  const seen = new Set<string>();
  const parcalar: string[] = [];

  for (const raw of [...cleanPart(mahalle), ...cleanPart(ilce), ...cleanPart(il)]) {
    const key = raw.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) continue;
    seen.add(key);
    parcalar.push(raw);
  }

  return parcalar.join(", ");
}
