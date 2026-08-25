import { useMemo, useState } from "react";
import { useI18n } from '@/hooks/useI18n';
import { AnimatePresence, motion } from "framer-motion";
import { Download, FolderPlus, Heart, Pencil, Trash2 } from "lucide-react";
import { useAppStore } from "@/state/appStore";
import { useUiStore } from "@/state/uiStore";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useClipboard } from "@/hooks/useClipboard";
import { saveTextFile } from "@/lib/export/fileSave";
import type { FavoriteCollection } from "@shared/types";

export function FavoritesPage() {
  const favorites = useAppStore((s) => s.favorites);
  const collections = useAppStore((s) => s.collections);
  const addCollection = useAppStore((s) => s.addCollection);
  const renameCollection = useAppStore((s) => s.renameCollection);
  const deleteCollection = useAppStore((s) => s.deleteCollection);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const setActiveColor = useAppStore((s) => s.setActiveColor);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const notify = useAppStore((s) => s.notify);
  const { copy } = useClipboard();
  const t = useI18n();

  const [dialog, setDialog] = useState<{ mode: "create" | "rename"; collection?: FavoriteCollection } | null>(
    null,
  );
  const [name, setName] = useState("");

  const grouped = useMemo(
    () =>
      collections.map((collection) => ({
        collection,
        items: favorites.filter((f) => f.collectionId === collection.id),
      })),
    [collections, favorites],
  );

  const openCreate = () => {
    setName("");
    setDialog({ mode: "create" });
  };
  const openRename = (collection: FavoriteCollection) => {
    setName(collection.name);
    setDialog({ mode: "rename", collection });
  };

  const submitDialog = () => {
    if (!name.trim()) return;
    if (dialog?.mode === "create") addCollection(name.trim());
    else if (dialog?.mode === "rename" && dialog.collection) renameCollection(dialog.collection.id, name.trim());
    setDialog(null);
  };

  const exportCollection = async (collection: FavoriteCollection) => {
    const items = favorites.filter((f) => f.collectionId === collection.id);
    const json = JSON.stringify(
      { collection: collection.name, colors: items.map((i) => i.hex) },
      null,
      2,
    );
    const saved = await saveTextFile(`colorflow-${collection.name}.json`, json, [
      { name: "JSON", extensions: ["json"] },
    ]);
    if (saved) notify("Collection exportée", "success");
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[color:var(--text-primary)]">Favoris</h2>
        <Button size="sm" variant="secondary" onClick={openCreate}>
          <FolderPlus className="h-3.5 w-3.5" />
          {t.favorites.newCollection}
        </Button>
      </div>

      {grouped.map(({ collection, items }) => (
        <div key={collection.id} className="glass-panel rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-white/88">{collection.name}</h3>
              <span className="mono-tabular rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-tertiary">
                {items.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => exportCollection(collection)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-secondary hover:bg-[color:var(--panel-bg-strong)] hover:text-[color:var(--text-primary)]"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => openRename(collection)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-secondary hover:bg-[color:var(--panel-bg-strong)] hover:text-[color:var(--text-primary)]"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {collection.id !== "default" && (
                <button
                  onClick={() => deleteCollection(collection.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-secondary hover:bg-red-500/20 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-tertiary">
              {t.favorites.emptyCollection}
            </p>
          ) : (
            <div className="grid grid-cols-6 gap-2">
              <AnimatePresence initial={false}>
                {items.map((fav) => (
                  <motion.div
                    key={fav.id}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="group relative"
                  >
                    <button
                      onClick={() => {
                        setActiveColor(fav.hex, "manual");
                        setActivePage("color");
                      }}
                      onDoubleClick={() => copy(fav.hex, fav.id, fav.hex.toUpperCase())}
                      style={{ backgroundColor: fav.hex }}
                      className="h-16 w-full rounded-xl border border-[color:var(--panel-border-strong)] shadow-glass transition group-hover:scale-[1.03]"
                    />
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow transition group-hover:opacity-100"
                    >
                      <Heart className="h-2.5 w-2.5 fill-current text-pink-300" />
                    </button>
                    <p className="mono-tabular mt-1 text-center text-[10px] text-tertiary">
                      {fav.hex.toUpperCase()}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      ))}

      <Dialog
        open={!!dialog}
        onOpenChange={(open) => !open && setDialog(null)}
        title={dialog?.mode === "create" ? t.favorites.newCollection : t.favorites.renameCollection}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitDialog()}
          placeholder="Nom de la collection"
          className="mb-4 w-full rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] px-3 py-2 text-sm text-[color:var(--text-primary)] focus-ring"
        />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setDialog(null)}>
            Annuler
          </Button>
          <Button size="sm" variant="primary" onClick={submitDialog}>
            Confirmer
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
