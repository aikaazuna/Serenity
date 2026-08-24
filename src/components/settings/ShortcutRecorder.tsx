import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/utils";

interface ShortcutRecorderProps {
  value: string;
  onChange: (accelerator: string) => void;
}

function keyToAcceleratorPart(e: KeyboardEvent | React.KeyboardEvent): string | null {
  const key = e.key;
  if (["Control", "Shift", "Alt", "Meta"].includes(key)) return null;
  if (key === " ") return "Space";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

export function ShortcutRecorder({ value, onChange }: ShortcutRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  const startRecording = () => {
    setDraft([]);
    setRecording(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    if (e.key === "Escape") {
      setRecording(false);
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");

    const main = keyToAcceleratorPart(e);
    if (main) parts.push(main);

    setDraft(parts);

    if (main && parts.length >= 2) {
      onChange(parts.join("+"));
      setRecording(false);
    }
  };

  const displayParts = (recording ? draft : value.split("+")).filter(Boolean);

  return (
    <button
      onClick={startRecording}
      onKeyDown={recording ? handleKeyDown : undefined}
      onBlur={() => setRecording(false)}
      className={cn(
        "flex h-9 min-w-[220px] items-center justify-between gap-2 rounded-lg border px-3 text-sm transition focus-ring",
        recording ? "border-white/40 bg-white/10" : "border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] hover:bg-[color:var(--panel-bg-strong)]",
      )}
    >
      <div className="flex items-center gap-1">
        {displayParts.length === 0 ? (
          <span className="text-tertiary">Appuyez sur une combinaison…</span>
        ) : (
          displayParts.map((part, i) => <Kbd key={`${part}-${i}`}>{part}</Kbd>)
        )}
      </div>
      {recording ? (
        <Check className="h-3.5 w-3.5 text-emerald-300" />
      ) : (
        <Pencil className="h-3.5 w-3.5 text-tertiary" />
      )}
    </button>
  );
}
