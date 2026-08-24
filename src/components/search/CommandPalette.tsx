import React, { useEffect, useState, useMemo, useDeferredValue } from "react";
import {
  Search,
  Pipette,
  Palette,
  Sparkles,
  Image as ImageIcon,
  Eye,
  Bookmark,
  Sliders,
  Headphones,
  Volume2,
  FolderSync,
  Settings,
  Compass,
  X,
  Loader2,
} from "lucide-react";
import { useUiStore } from "@/state/uiStore";
import { useAppStore } from "@/state/appStore";
import { useAudioStore } from "@/state/audioStore";
import { startPicker } from "@/hooks/usePickerBridge";
import { useI18n } from "@/hooks/useI18n";
import {
  ALL_AUTOEQ_MODELS,
  getAutoEqPreset,
  searchAutoEqModels,
  normalizeSearchText,
} from "@/lib/autoeq-service";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: typeof Compass;
  action: () => void | Promise<void>;
  color?: string;
}

export function CommandPalette() {
  const t = useI18n();
  const isSearchOpen = useUiStore((s) => s.isSearchOpen);
  const closeSearch = useUiStore((s) => s.closeSearch);
  const toggleSearch = useUiStore((s) => s.toggleSearch);
  const setActivePage = useUiStore((s) => s.setActivePage);

  const setActiveColor = useAppStore((s) => s.setActiveColor);
  const favorites = useAppStore((s) => s.favorites);
  const applyPreset = useAudioStore((s) => s.applyPreset);
  const notify = useAppStore((s) => s.notify);

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);

  // Reset query on open/close
  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  // Global shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleSearch();
      }
      if (e.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, toggleSearch, closeSearch]);

  const navItems: SearchItem[] = useMemo(
    () => [
      {
        id: "nav-hub",
        title: t.nav.hub,
        subtitle: t.hub.modulesCount,
        category: t.search.toolsCategory,
        icon: Compass,
        action: () => {
          setActivePage("hub");
          closeSearch();
        },
      },
      {
        id: "nav-picker",
        title: t.picker.launch,
        subtitle: t.picker.inAppOnly,
        category: t.search.toolsCategory,
        icon: Pipette,
        action: () => {
          closeSearch();
          void startPicker();
        },
      },
      {
        id: "nav-color",
        title: t.nav.color,
        subtitle: t.hub.tools.colorDesc,
        category: t.search.toolsCategory,
        icon: Pipette,
        action: () => {
          setActivePage("color");
          closeSearch();
        },
      },
      {
        id: "nav-palettes",
        title: t.nav.palettes,
        subtitle: t.hub.swatches,
        category: t.search.toolsCategory,
        icon: Palette,
        action: () => {
          setActivePage("palettes");
          closeSearch();
        },
      },
      {
        id: "nav-gradients",
        title: t.nav.gradients,
        subtitle: t.hub.tools.gradientsDesc,
        category: t.search.toolsCategory,
        icon: Sparkles,
        action: () => {
          setActivePage("gradients");
          closeSearch();
        },
      },
      {
        id: "nav-extract",
        title: t.nav.imageExtract,
        subtitle: t.hub.tools.imageDesc,
        category: t.search.toolsCategory,
        icon: ImageIcon,
        action: () => {
          setActivePage("image-extract");
          closeSearch();
        },
      },
      {
        id: "nav-access",
        title: t.nav.accessibility,
        subtitle: t.hub.tools.accessibilityDesc,
        category: t.search.toolsCategory,
        icon: Eye,
        action: () => {
          setActivePage("accessibility");
          closeSearch();
        },
      },
      {
        id: "nav-eq",
        title: t.nav.audioEq,
        subtitle: t.hub.tools.audioDesc,
        category: t.search.toolsCategory,
        icon: Sliders,
        action: () => {
          setActivePage("audio-eq");
          closeSearch();
        },
      },
      {
        id: "nav-presets",
        title: t.nav.audioPresets,
        subtitle: t.hub.tools.presetsDesc,
        category: t.search.toolsCategory,
        icon: Headphones,
        action: () => {
          setActivePage("audio-presets");
          closeSearch();
        },
      },
      {
        id: "nav-lab",
        title: t.nav.audioLab,
        subtitle: t.hub.tools.labDesc,
        category: t.search.toolsCategory,
        icon: Volume2,
        action: () => {
          setActivePage("audio-lab");
          closeSearch();
        },
      },
      {
        id: "nav-profiles",
        title: t.nav.audioProfiles,
        subtitle: t.audio.rackSubtitle,
        category: t.search.toolsCategory,
        icon: FolderSync,
        action: () => {
          setActivePage("audio-profiles");
          closeSearch();
        },
      },
      {
        id: "nav-mixer",
        title: t.nav.mixer,
        subtitle: t.mixer.desc,
        category: t.search.toolsCategory,
        icon: Sliders,
        action: () => {
          setActivePage("mixer");
          closeSearch();
        },
      },
      {
        id: "nav-clips",
        title: t.nav.clips,
        subtitle: t.clips.desc,
        category: t.search.toolsCategory,
        icon: Headphones,
        action: () => {
          setActivePage("clips");
          closeSearch();
        },
      },
      {
        id: "nav-settings",
        title: t.nav.settings,
        subtitle: t.settings.subtitle,
        category: t.search.toolsCategory,
        icon: Settings,
        action: () => {
          setActivePage("settings");
          closeSearch();
        },
      },
    ],
    [setActivePage, closeSearch, t]
  );

  const favoriteItems: SearchItem[] = useMemo(
    () =>
      favorites.map((fav) => ({
        id: `fav-${fav.id}`,
        title: fav.name ? `${fav.name} (${fav.hex.toUpperCase()})` : fav.hex.toUpperCase(),
        subtitle: "Couleur favorite enregistrée",
        category: t.search.colorsCategory,
        icon: Bookmark,
        color: fav.hex,
        action: () => {
          setActiveColor(fav.hex, "manual");
          setActivePage("color");
          closeSearch();
        },
      })),
    [favorites, setActiveColor, setActivePage, closeSearch, t]
  );

  // Compute live search items reactively with deferredQuery
  const filteredItems = useMemo(() => {
    const rawQ = deferredQuery.trim();

    if (!rawQ) {
      // Popular headphones when query is empty
      const popular = [
        "Apple AirPods Pro 2",
        "Apple AirPods Max",
        "Sennheiser HD 600",
        "Sony WH-1000XM4",
        "Beyerdynamic DT 770 Pro 80 Ohm",
        "Hifiman Sundara",
      ];
      const defaultHeadphones: SearchItem[] = ALL_AUTOEQ_MODELS.filter((m) => popular.some((p) => m.name.includes(p)))
        .slice(0, 6)
        .map((model) => ({
          id: `autoeq-${model.id}`,
          title: `Appliquer : ${model.name}`,
          subtitle: `Calibration AutoEQ (${model.source}) • ${model.brand}`,
          category: t.search.autoEqCategory,
          icon: Headphones,
          action: async () => {
            setLoadingPresetId(model.id);
            try {
              const p = await getAutoEqPreset(model);
              applyPreset(p);
              notify(`Calibration « ${p.name} » appliquée`, "success");
              closeSearch();
            } finally {
              setLoadingPresetId(null);
            }
          },
        }));

      return [...navItems, ...favoriteItems, ...defaultHeadphones];
    }

    const qNorm = normalizeSearchText(rawQ);

    // Filter tools and favorites
    const matchingNav = navItems.filter(
      (i) => normalizeSearchText(i.title).includes(qNorm) || normalizeSearchText(i.subtitle).includes(qNorm)
    );
    const matchingFav = favoriteItems.filter(
      (i) => normalizeSearchText(i.title).includes(qNorm) || normalizeSearchText(i.subtitle).includes(qNorm)
    );

    // Filter AutoEQ models via ultra-fast pre-indexed engine (<0.5ms)
    const matchingAutoEq: SearchItem[] = searchAutoEqModels(rawQ, "Tous", "all", 15).map((model) => ({
      id: `autoeq-${model.id}`,
      title: `Appliquer : ${model.name}`,
      subtitle: `Calibration AutoEQ (${model.source}) • ${model.brand}`,
      category: t.search.autoEqCategory,
      icon: Headphones,
      action: async () => {
        setLoadingPresetId(model.id);
        try {
          const p = await getAutoEqPreset(model);
          applyPreset(p);
          notify(`Calibration « ${p.name} » appliquée`, "success");
          closeSearch();
        } finally {
          setLoadingPresetId(null);
        }
      },
    }));

    return [...matchingNav, ...matchingAutoEq, ...matchingFav];
  }, [deferredQuery, navItems, favoriteItems, applyPreset, notify, closeSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) void current.action();
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 backdrop-blur-md bg-black/40 animate-fadeIn">
      <div className="apple-card w-full max-w-xl overflow-hidden border border-[color:var(--panel-border-strong)] shadow-2xl p-0 transition-transform">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-[color:var(--card-border)] px-4 py-3.5 bg-[color:var(--input-bg)]">
          <Search className="h-4 w-4 text-tertiary shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder={t.search.placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-[color:var(--text-primary)] placeholder:text-tertiary focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-tertiary hover:text-[color:var(--text-primary)] p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded border border-[color:var(--panel-border)] bg-[color:var(--card-bg)] px-1.5 py-0.5 text-[10px] font-medium text-tertiary font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-tertiary">
              {t.search.noResults} « {query} »
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                const isLoading = loadingPresetId && item.id.includes(loadingPresetId);

                return (
                  <button
                    key={item.id}
                    onClick={() => void item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition cursor-pointer ${
                      isSelected
                        ? "bg-[#0A84FF] text-white shadow-sm"
                        : "hover:bg-[color:var(--panel-bg-hover)] text-[color:var(--text-primary)]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.color ? (
                        <span
                          className="h-5 w-5 rounded-lg border border-black/20 shadow-sm shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                      ) : isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white shrink-0" />
                      ) : (
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isSelected ? "text-white" : "text-[#0A84FF]"
                          }`}
                        />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            isSelected ? "text-white" : "text-[color:var(--text-primary)]"
                          }`}
                        >
                          {item.title}
                        </p>
                        <p
                          className={`text-[11px] truncate ${
                            isSelected ? "text-white/80" : "text-secondary"
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-black/10 dark:bg-white/10 text-tertiary"
                      }`}
                    >
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Guide */}
        <div className="flex items-center justify-between border-t border-[color:var(--card-border)] bg-[color:var(--card-bg)] px-4 py-2 text-[11px] text-tertiary">
          <span>
            <strong>↑ ↓</strong> {t.search.hint}
          </span>
          <span>{t.search.modelsIndexed}</span>
        </div>
      </div>
    </div>
  );
}