import { useEffect } from "react";
import { useAppStore } from "@/state/appStore";

export function useTheme(): void {
  const theme = useAppStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;

    const apply = (mode: "dark" | "light") => {
      root.classList.remove("dark", "light");
      root.classList.add(mode);
    };

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      apply(media.matches ? "dark" : "light");
      const listener = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }

    apply(theme);
    return undefined;
  }, [theme]);
}
