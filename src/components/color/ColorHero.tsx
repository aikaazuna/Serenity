import { useEffect, useRef, useState } from "react";
import { useI18n } from '@/hooks/useI18n';
import { motion } from "framer-motion";
import { Heart, Pipette, Shuffle } from "lucide-react";
import type { ColorSnapshot } from "@shared/types";
import { useAppStore } from "@/state/appStore";
import { startPicker } from "@/hooks/usePickerBridge";
import { useClipboard } from "@/hooks/useClipboard";
import { useAnimationsEnabled } from "@/hooks/useAnimations";
import { formatColorValue } from "@/lib/color/formats";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { isValidHex } from "@/lib/color/convert";

function randomHex(): string {
  const value = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `#${value}`;
}

export function ColorHero({ color }: { color: ColorSnapshot }) {
  const t = useI18n();
  const setActiveColor = useAppStore((s) => s.setActiveColor);
  const addFavorite = useAppStore((s) => s.addFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite(color.hex));
  const defaultCopyFormat = useAppStore((s) => s.settings.defaultCopyFormat);
  const notify = useAppStore((s) => s.notify);
  const { copy } = useClipboard();
  const animationsEnabled = useAnimationsEnabled();
  const [draft, setDraft] = useState(color.hex);
  const isFocused = useRef(false);

  // Garde le champ synchronisé quand la couleur active change depuis une autre source
  // (recherche, historique, favoris…) sans écraser ce que l'utilisateur est en train de taper.
  useEffect(() => {
    if (!isFocused.current) setDraft(color.hex);
  }, [color.hex]);

  const commitDraft = () => {
    isFocused.current = false;
    if (isValidHex(draft)) setActiveColor(draft, "manual");
    else setDraft(color.hex);
  };

  const copyDefaultFormat = () => {
    const value = formatColorValue(color, defaultCopyFormat);
    void copy(value, `default-${defaultCopyFormat}`, defaultCopyFormat.toUpperCase());
  };

  return (
    <div className="flex items-center gap-6">
      <motion.button
        type="button"
        key={color.hex}
        initial={animationsEnabled ? { scale: 0.9, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 24 }}
        onClick={copyDefaultFormat}
        title={`Copier en ${defaultCopyFormat.toUpperCase()}`}
        className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border border-[color:var(--panel-border-strong)] shadow-glow focus-ring"
        style={{ backgroundColor: color.hex }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/20" />
      </motion.button>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => (isFocused.current = true)}
            onBlur={commitDraft}
            onKeyDown={(e) => e.key === "Enter" && commitDraft()}
            spellCheck={false}
            className="mono-tabular w-40 rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] px-3 py-1.5 text-lg font-semibold uppercase tracking-tight text-[color:var(--text-primary)] focus-ring"
          />
          {color.name && (
            <span className="rounded-full border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] px-2.5 py-1 text-[11px] capitalize text-secondary">
              proche de « {color.name} »
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => void startPicker()}>
            <Pipette className="h-3.5 w-3.5" />
            {t.colorHero.picker}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setActiveColor(randomHex(), "manual")}>
            <Shuffle className="h-3.5 w-3.5" />
            Aléatoire
          </Button>
          <Button
            size="sm"
            variant={isFavorite ? "primary" : "secondary"}
            onClick={() => {
              if (isFavorite) return;
              addFavorite(color.hex);
              notify(t.colorHero.addedToFav, "success", color.hex.toUpperCase());
            }}
          >
            <Heart className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
            {isFavorite ? "Favori" : "Ajouter aux favoris"}
          </Button>
        </div>
      </div>
    </div>
  );
}