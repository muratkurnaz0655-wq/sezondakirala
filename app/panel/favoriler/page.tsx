import { FavoritesPanel } from "@/components/favorites-panel";

export default function FavoritesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Favorilerim</h1>
      <FavoritesPanel />
    </div>
  );
}
