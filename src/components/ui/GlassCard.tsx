import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  strong?: boolean;
}

export function GlassCard({ className, children, strong, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        strong ? "glass-panel-strong" : "glass-panel",
        "rounded-2xl shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
