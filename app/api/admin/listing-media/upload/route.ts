import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/auth/guards";

const MEDIA_BUCKET = "ilan-medyalari";

function normalizeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdminUser();
    if (!admin.ok) return NextResponse.json({ success: false, error: admin.error }, { status: 403 });

    const formData = await req.formData();
    const listingId = String(formData.get("listing_id") ?? "");
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

    if (!listingId) {
      return NextResponse.json({ success: false, error: "Ilan ID eksik." }, { status: 400 });
    }
    if (!files.length) {
      return NextResponse.json({ success: false, error: "Dosya secilmedi." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: currentMedia } = await supabase
      .from("ilan_medyalari")
      .select("sira")
      .eq("ilan_id", listingId)
      .order("sira", { ascending: false })
      .limit(1);
    let nextOrder = (currentMedia?.[0]?.sira ?? 0) + 1;

    for (const file of files) {
      const safeName = normalizeFileName(file.name || "image.jpg");
      const objectPath = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(objectPath, file, { upsert: false, contentType: file.type || "image/jpeg" });
      if (uploadError) {
        return NextResponse.json(
          { success: false, error: `Dosya yuklenemedi: ${uploadError.message}` },
          { status: 400 },
        );
      }

      const { data: publicData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
      const { error: insertError } = await supabase.from("ilan_medyalari").insert({
        ilan_id: listingId,
        url: publicData.publicUrl,
        tip: "resim",
        sira: nextOrder,
      });
      if (insertError) {
        return NextResponse.json(
          { success: false, error: `Medya kaydi eklenemedi: ${insertError.message}` },
          { status: 400 },
        );
      }
      nextOrder += 1;
    }

    const { data: media } = await supabase
      .from("ilan_medyalari")
      .select("id,url,sira,ilan_id")
      .eq("ilan_id", listingId)
      .order("sira", { ascending: true });

    return NextResponse.json({ success: true, media: media ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen bir hata olustu.";
    return NextResponse.json({ success: false, error: `Upload route hatasi: ${message}` }, { status: 500 });
  }
}
