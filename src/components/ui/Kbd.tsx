import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded-md border border-[color:var(--panel-border-strong)] bg-white/[0.06] px-1.5 text-[10px] font-medium text-secondary",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
