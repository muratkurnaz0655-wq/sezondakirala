import type { SupabaseClient } from "@supabase/supabase-js";

export function slugify(text: string): string {
  const map: Record<string, string> = {
    Ç: "c",
    ç: "c",
    Ğ: "g",
    ğ: "g",
    İ: "i",
    ı: "i",
    Ö: "o",
    ö: "o",
    Ş: "s",
    ş: "s",
    Ü: "u",
    ü: "u",
    Â: "a",
    â: "a",
    Î: "i",
    î: "i",
    Û: "u",
    û: "u",
  };

  return text
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function generateUniqueSlug(
  supabase: SupabaseClient,
  title: string,
  table: "paketler" | "ilanlar",
): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 1;

  while (true) {
    const { data } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i++}`;
  }
}
