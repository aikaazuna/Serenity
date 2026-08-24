import React from "react";
import { useAudioStore } from "@/state/audioStore";
import { FilterType } from "@/types/audio";
import { Plus, Trash2, Sliders, Power } from "lucide-react";

const FILTER_TYPES: { type: FilterType; label: string; desc: string }[] = [
  { type: "PK", label: "Peaking (Bell)", desc: "Amplifie ou atténue autour d'une fréquence centrale" },
  { type: "LS", label: "Low Shelf", desc: "Ajuste tout le spectre sous la fréquence" },
  { type: "HS", label: "High Shelf", desc: "Ajuste tout le spectre au-dessus de la fréquence" },
  { type: "HP", label: "High Pass", desc: "Coupe les basses fréquences indésirables" },
  { type: "LP", label: "Low Pass", desc: "Coupe les très hautes fréquences" },
  { type: "NO", label: "Notch", desc: "Supprime une résonance précise" },
  { type: "BP", label: "Band Pass", desc: "Isole une bande de fréquences" },
  { type: "AP", label: "All Pass", desc: "Ajustement de phase" },
];

const FILTER_COLORS = [
  "#0A84FF",
  "#30D158",
  "#FF9F0A",
  "#BF5AF2",
  "#FF375F",
  "#64D2FF",
  "#FFD60A",
  "#5E5CE6",
];

export const ParametricEQ: React.FC = () => {
  const parametricFilters = useAudioStore((s) => s.parametricFilters) || [];
  const addParametricFilter = useAudioStore((s) => s.addParametricFilter);
  const removeParametricFilter = useAudioStore((s) => s.removeParametricFilter);
  const updateParametricFilter = useAudioStore((s) => s.updateParametricFilter);

  return (
    <div className="apple-card p-5 select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#0A84FF]" />
          <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
            Filtres Paramétriques ({parametricFilters.length})
          </h3>
        </div>

        <button
          onClick={() => addParametricFilter()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0A84FF] hover:bg-[#0071E3] rounded-xl shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ajouter un filtre</span>
        </button>
      </div>

      {/* Filter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {parametricFilters.map((filter, index) => {
          if (!filter) return null;
          const color = FILTER_COLORS[index % FILTER_COLORS.length];
          const freq = filter.freq ?? 1000;
          const gain = filter.gain ?? 0;
          const q = filter.q ?? 1.41;

          return (
            <div
              key={filter.id || index}
              className={`apple-inner-box p-3.5 space-y-3 transition ${
                !filter.enabled ? "opacity-40" : ""
              }`}
            >
              {/* Card Top: Node Number, Type, Toggle, Delete */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {index + 1}
                  </div>

                  <select
                    value={filter.type || "PK"}
                    onChange={(e) =>
                      updateParametricFilter(index, {
                        type: e.target.value as FilterType,
                      })
                    }
                    className="bg-transparent text-xs font-bold text-[color:var(--text-primary)] focus:outline-none cursor-pointer"
                  >
                    {FILTER_TYPES.map((t) => (
                      <option key={t.type} value={t.type} className="bg-[#1C1C1E] text-white">
                        {t.type} – {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      updateParametricFilter(index, { enabled: !filter.enabled })
                    }
                    className={`p-1 rounded-md transition ${
                      filter.enabled
                        ? "text-emerald-500 hover:bg-emerald-500/10"
                        : "text-tertiary hover:text-white"
                    }`}
                    title={filter.enabled ? "Désactiver le filtre" : "Activer"}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => removeParametricFilter(index)}
                    className="p-1 text-tertiary hover:text-red-400 hover:bg-red-400/10 rounded-md transition"
                    title="Supprimer le filtre"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Slider 1: Frequency */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-secondary font-medium">Fréquence</span>
                  <span className="font-mono font-bold text-[color:var(--text-primary)]">
                    {freq.toFixed(0)} Hz
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="20000"
                  step="5"
                  value={freq}
                  onChange={(e) =>
                    updateParametricFilter(index, {
                      freq: parseFloat(e.target.value) || 1000,
                    })
                  }
                  className="w-full h-1.5 bg-black/20 dark:bg-black/50 rounded-full appearance-none accent-[#0A84FF] cursor-pointer"
                />
              </div>

              {/* Slider 2: Gain */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-secondary font-medium">Gain</span>
                  <span
                    className={`font-mono font-bold ${
                      gain > 0
                        ? "text-[#0A84FF]"
                        : gain < 0
                        ? "text-amber-500"
                        : "text-tertiary"
                    }`}
                  >
                    {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={gain}
                  onChange={(e) =>
                    updateParametricFilter(index, {
                      gain: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full h-1.5 bg-black/20 dark:bg-black/50 rounded-full appearance-none accent-[#0A84FF] cursor-pointer"
                />
              </div>

              {/* Slider 3: Q Factor */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-secondary font-medium">Facteur Q</span>
                  <span className="font-mono text-tertiary font-semibold">
                    {q.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.05"
                  value={q}
                  onChange={(e) =>
                    updateParametricFilter(index, {
                      q: parseFloat(e.target.value) || 1.41,
                    })
                  }
                  className="w-full h-1.5 bg-black/20 dark:bg-black/50 rounded-full appearance-none accent-[#0A84FF] cursor-pointer"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
