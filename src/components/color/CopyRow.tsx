import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useClipboard } from "@/hooks/useClipboard";
import { cn } from "@/lib/utils";

interface CopyRowProps {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}

export function CopyRow({ label, value, mono = true, multiline = false }: CopyRowProps) {
  const { copy, copiedKey } = useClipboard();
  const isCopied = copiedKey === label;

  return (
    <button
      onClick={() => copy(value, label, label)}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-[color:var(--panel-border)] bg-white/[0.02] px-3.5 py-2.5 text-left transition hover:border-white/12 hover:bg-[color:var(--panel-bg)] focus-ring"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-tertiary">{label}</p>
        <p
          className={cn(
            "mt-0.5 truncate text-[13px] text-[color:var(--text-primary)]",
            mono && "mono-tabular",
            multiline && "whitespace-pre-line",
          )}
        >
          {value}
        </p>
      </div>
      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--panel-bg)] text-secondary transition group-hover:bg-[color:var(--panel-bg-strong)] group-hover:text-[color:var(--text-primary)]">
        <AnimatePresence mode="wait" initial={false}>
          {isCopied ? (
            <motion.span
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="h-3.5 w-3.5 text-emerald-300" />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Copy className="h-3.5 w-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
