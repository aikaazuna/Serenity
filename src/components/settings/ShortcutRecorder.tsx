import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/utils";

interface ShortcutRecorderProps {
  value: string;
  onChange: (accelerator: string) => void;
  placeholder?: string;
  className?: string;
}

function keyToAcceleratorPart(e: KeyboardEvent | React.KeyboardEvent): string | null {
  const key = e.key;
  if (["Control", "Shift", "Alt", "Meta"].includes(key)) return null;
  if (key === " ") return "Space";
  if (/^F\d{1,2}$/i.test(key)) return key.toUpperCase();
  if (key === "PrintScreen" || key === "Snapshot") return "PrintScreen";
  if (key === "ArrowUp") return "Up";
  if (key === "ArrowDown") return "Down";
  if (key === "ArrowLeft") return "Left";
  if (key === "ArrowRight") return "Right";
  if (key === "Escape") return null;
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function formatPartForDisplay(part: string): string {
  if (part === "CommandOrControl") return navigator.platform.toUpperCase().includes("MAC") ? "Cmd" : "Ctrl";
  return part;
}

export function ShortcutRecorder({
  value,
  onChange,
  placeholder = "Appuyez sur une touche ou combinaison…",
  className,
}: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  const startRecording = () => {
    setDraft([]);
    setRecording(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      setRecording(false);
      return;
    }

    if ((e.key === "Backspace" || e.key === "Delete") && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
      onChange("");
      setRecording(false);
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
    if (e.altKey) parts.push("Alt");
    if (e.shiftKey) parts.push("Shift");

    const main = keyToAcceleratorPart(e);
    if (main && !parts.includes(main)) {
      parts.push(main);
    }

    setDraft(parts);

    // Commit if we have a valid key: single function/nav key or modifier combo
    if (main) {
      const isSingleAllowedKey =
        /^F\d{1,2}$/i.test(main) ||
        ["PrintScreen", "Insert", "Home", "End", "PageUp", "PageDown", "Pause", "ScrollLock"].includes(main);

      if (parts.length >= 2 || isSingleAllowedKey) {
        onChange(parts.join("+"));
        setRecording(false);
      }
    }
  };

  const rawParts = recording ? draft : (value ? value.split("+") : []);
  const displayParts = rawParts.filter(Boolean);

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={startRecording}
        onKeyDown={recording ? handleKeyDown : undefined}
        onBlur={() => setRecording(false)}
        className={cn(
          "flex h-9 min-w-[200px] items-center justify-between gap-2 rounded-xl border px-3 text-xs font-medium transition focus-ring cursor-pointer select-none",
          recording
            ? "border-[#0A84FF] bg-[#0A84FF]/15 ring-2 ring-[#0A84FF]/30 text-white"
            : "border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)] text-[color:var(--text-primary)]",
          className
        )}
      >
        <div className="flex items-center gap-1 overflow-hidden">
          {displayParts.length === 0 ? (
            <span className="text-tertiary text-xs italic">{recording ? "En attente des touches…" : placeholder}</span>
          ) : (
            displayParts.map((part, i) => (
              <Kbd key={`${part}-${i}`} className="text-[11px] font-mono font-bold">
                {formatPartForDisplay(part)}
              </Kbd>
            ))
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {recording ? (
            <Check className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <Pencil className="h-3.5 w-3.5 text-tertiary" />
          )}
        </div>
      </button>

      {value && !recording && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
          }}
          className="p-1.5 text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
          title="Désactiver ce raccourci"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

