"use client";

import { Download } from "lucide-react";
import { AdminActionButton } from "@/components/admin/AdminActionButton";

type ExportReservation = {
  referansNo: string;
  kullaniciAdi: string;
  email: string;
  ilanAdi: string;
  girisTarihi: string;
  cikisTarihi: string;
  geceSayisi: number;
  misafirSayisi: number;
  tutar: number;
  durum: string;
  olusturulmaTarihi: string;
};

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function ReservationExportButton({ rows }: { rows: ExportReservation[] }) {
  function exportRows() {
    const headers = [
      "Ref No",
      "Kullanıcı Adı",
      "E-posta",
      "İlan Adı",
      "Giriş Tarihi",
      "Çıkış Tarihi",
      "Gece Sayısı",
      "Misafir Sayısı",
      "Tutar",
      "Durum",
      "Oluşturulma Tarihi",
    ];
    const body = rows.map((row) =>
      [
        row.referansNo,
        row.kullaniciAdi,
        row.email,
        row.ilanAdi,
        row.girisTarihi,
        row.cikisTarihi,
        row.geceSayisi,
        row.misafirSayisi,
        row.tutar,
        row.durum,
        row.olusturulmaTarihi,
      ]
        .map(csvEscape)
        .join(";"),
    );
    const blob = new Blob([`\uFEFF${[headers.join(";"), ...body].join("\n")}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rezervasyonlar-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminActionButton type="button" variant="success" size="md" onClick={exportRows}>
      <Download className="h-4 w-4" />
      Excel&apos;e Aktar
    </AdminActionButton>
  );
}
