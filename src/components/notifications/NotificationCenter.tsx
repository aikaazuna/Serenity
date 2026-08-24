import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { useAppStore } from "@/state/appStore";
import { cn } from "@/lib/utils";

const TONE_ICON = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
};

const TONE_ACCENT = {
  success: "text-emerald-300",
  info: "text-sky-300",
  warning: "text-amber-300",
};

export function NotificationCenter() {
  const notifications = useAppStore((s) => s.notifications);
  const dismiss = useAppStore((s) => s.dismissNotification);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[400] flex w-[300px] flex-col gap-2">
      <AnimatePresence>
        {notifications.map((n) => {
          const Icon = TONE_ICON[n.tone];
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              onClick={() => dismiss(n.id)}
              className="glass-panel-strong pointer-events-auto flex cursor-pointer items-start gap-2.5 rounded-xl px-3.5 py-3 shadow-glass-lg"
            >
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", TONE_ACCENT[n.tone])} />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[color:var(--text-primary)]">{n.message}</p>
                {n.description && (
                  <p className="mono-tabular mt-0.5 truncate text-[11px] text-tertiary">
                    {n.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
