import { useMemo, useState } from "react";
import { useI18n } from '@/hooks/useI18n';
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Pipette, Search, Trash2 } from "lucide-react";
import { useAppStore } from "@/state/appStore";
import { useUiStore } from "@/state/uiStore";
import { formatRelativeDate, cn } from "@/lib/utils";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { HistoryEntry } from "@shared/types";

type SortMode = "recent" | "oldest" | "hex";

const SOURCE_LABEL: Record<HistoryEntry["source"], string> = {
  picker: "Pipette",
  manual: "Manuel",
  palette: "Palette",
};

export function HistoryPage() {
  const history = useAppStore((s) => s.history);
  const removeHistoryEntry = useAppStore((s) => s.removeHistoryEntry);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const addFavorite = useAppStore((s) => s.addFavorite);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const favorites = useAppStore((s) => s.favorites);
  const setActiveColor = useAppStore((s) => s.setActiveColor);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const notify = useAppStore((s) => s.notify);
  const t = useI18n();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");

  const favoriteHexes = useMemo(() => new Set(favorites.map((f) => f.hex)), [favorites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, "");
    let items = history;
    if (q) items = items.filter((entry) => entry.hex.includes(q));
    items = [...items];
    if (sort === "recent") items.sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === "oldest") items.sort((a, b) => a.createdAt - b.createdAt);
    else items.sort((a, b) => a.hex.localeCompare(b.hex));
    return items;
  }, [history, query, sort]);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[color:var(--text-primary)]">{t.history.title}</h2>
        {history.length > 0 && (
          <Button size="sm" variant="ghost" onClick={clearHistory}>
            <Trash2 className="h-3.5 w-3.5" />
            Tout effacer
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-[color:var(--panel-border)] bg-white/[0.03] px-3">
          <Search className="h-3.5 w-3.5 text-tertiary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrer par HEX"
            className="w-full bg-transparent text-sm text-[color:var(--text-primary)] placeholder:text-tertiary focus:outline-none"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(v) => setSort(v as SortMode)}
          options={[
            { value: "recent", label: "Plus récent" },
            { value: "oldest", label: "Plus ancien" },
            { value: "hex", label: "Alphabétique" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[color:var(--panel-border)] py-16 text-center">
          <Pipette className="h-8 w-8 text-tertiary" />
          <p className="text-sm text-secondary">{t.history.empty}</p>
          <Button size="sm" variant="secondary" onClick={() => setActivePage("color")}>
            {t.history.openColor}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence initial={false}>
            {filtered.map((entry) => {
              const isFav = favoriteHexes.has(entry.hex);
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="glass-panel group flex items-center gap-3 rounded-xl p-2.5"
                >
                  <button
                    onClick={() => {
                      setActiveColor(entry.hex, "manual");
                      setActivePage("color");
                    }}
                    style={{ backgroundColor: entry.hex }}
                    className="h-11 w-11 shrink-0 rounded-lg border border-[color:var(--panel-border-strong)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="mono-tabular truncate text-[13px] font-medium text-[color:var(--text-primary)]">
                      {entry.hex.toUpperCase()}
                    </p>
                    <p className="truncate text-[11px] text-tertiary">
                      {SOURCE_LABEL[entry.source]} · {formatRelativeDate(entry.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        if (isFav) {
                          const fav = favorites.find((f) => f.hex === entry.hex);
                          if (fav) removeFavorite(fav.id);
                        } else {
                          addFavorite(entry.hex);
                          notify("Ajouté aux favoris", "success", entry.hex.toUpperCase());
                        }
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-secondary hover:bg-[color:var(--panel-bg-strong)] hover:text-[color:var(--text-primary)]"
                    >
                      <Heart className={cn("h-3.5 w-3.5", isFav && "fill-current text-pink-300")} />
                    </button>
                    <button
                      onClick={() => removeHistoryEntry(entry.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-secondary hover:bg-red-500/20 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
