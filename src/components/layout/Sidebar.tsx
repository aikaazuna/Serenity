import { motion } from "framer-motion";
import {
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
  SlidersHorizontal,
  Film,
  Settings,
  Compass,
} from "lucide-react";
import { useUiStore, type PageId } from "@/state/uiStore";
import { useAudioStore } from "@/state/audioStore";
import { useAnimationsEnabled } from "@/hooks/useAnimations";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils";

interface NavSection {
  title: string;
  items: {
    id: PageId;
    label: string;
    icon: typeof Pipette;
    badge?: string;
  }[];
}

export function Sidebar() {
  const activePage = useUiStore((s) => s.activePage);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const eqEnabled = useAudioStore((s) => s.eqEnabled);
  const animationsEnabled = useAnimationsEnabled();
  const t = useI18n();

  const sections: NavSection[] = [
    {
      title: t.sections.discover,
      items: [
        {
          id: "hub",
          label: t.nav.hub,
          icon: Compass,
        },
      ],
    },
    {
      title: t.sections.colorStudio,
      items: [
        {
          id: "color",
          label: t.nav.color,
          icon: Pipette,
        },
        {
          id: "palettes",
          label: t.nav.palettes,
          icon: Palette,
        },
        {
          id: "gradients",
          label: t.nav.gradients,
          icon: Sparkles,
        },
        {
          id: "image-extract",
          label: t.nav.imageExtract,
          icon: ImageIcon,
        },
        {
          id: "accessibility",
          label: t.nav.accessibility,
          icon: Eye,
        },
        {
          id: "library",
          label: t.nav.library,
          icon: Bookmark,
        },
      ],
    },
    {
      title: t.sections.multimediaStudio,
      items: [
        {
          id: "audio-eq",
          label: t.nav.audioEq,
          icon: Sliders,
          badge: eqEnabled ? t.badges.on : undefined,
        },
        {
          id: "audio-presets",
          label: t.nav.audioPresets,
          icon: Headphones,
        },
        {
          id: "audio-lab",
          label: t.nav.audioLab,
          icon: Volume2,
        },
        {
          id: "audio-profiles",
          label: t.nav.audioProfiles,
          icon: FolderSync,
        },
        {
          id: "mixer",
          label: t.nav.mixer,
          icon: SlidersHorizontal,
          badge: t.badges.soon,
        },
        {
          id: "clips",
          label: t.nav.clips,
          icon: Film,
          badge: t.badges.soon,
        },
      ],
    },
    {
      title: t.sections.system,
      items: [
        {
          id: "settings",
          label: t.nav.settings,
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside className="flex h-full w-68 shrink-0 flex-col justify-between border-r border-[color:var(--panel-border)] bg-[color:var(--sidebar-bg)] p-4 backdrop-blur-2xl select-none">
      <div className="flex flex-col gap-6 overflow-y-auto pr-1">
        {sections.map((section, sIdx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIdx * 0.05, duration: 0.3 }}
            className="flex flex-col gap-1.5"
          >
            <span className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-tertiary">
              {section.title}
            </span>

            <div className="flex flex-col gap-1">
              {section.items.map((item, iIdx) => {
                const isActive = activePage === item.id;
                const Icon = item.icon;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: sIdx * 0.05 + iIdx * 0.03, duration: 0.25 }}
                    whileHover={{ x: 2 }}
                    onClick={() => setActivePage(item.id)}
                    className={cn(
                      "group relative flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-xs font-medium transition-colors cursor-pointer",
                      isActive
                        ? "text-white dark:text-white"
                        : "text-secondary hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--text-primary)]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId={animationsEnabled ? "active-nav-pill" : undefined}
                        className="absolute inset-0 rounded-xl bg-[#0A84FF] shadow-sm"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 32,
                        }}
                      />
                    )}

                    <Icon
                      className={cn(
                        "relative z-10 h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                        isActive ? "text-white" : "text-secondary group-hover:text-[color:var(--text-primary)]"
                      )}
                    />

                    <span className="relative z-10 flex-1 truncate text-left font-medium">
                      {item.label}
                    </span>

                    {item.badge && (
                      <span
                        className={cn(
                          "relative z-10 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          isActive
                            ? "bg-white/25 text-white"
                            : item.badge === t.badges.soon
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                            : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-[color:var(--panel-border)] px-3 text-[11px] text-tertiary flex items-center justify-between">
        <span>Serenity Hub</span>
        <span className="font-mono text-[10px] opacity-75">v1.0</span>
      </div>
    </aside>
  );
}
