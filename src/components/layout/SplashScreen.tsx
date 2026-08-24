import { motion } from "framer-motion";
import appLogo from "@/assets/logo.png";

export function SplashScreen() {
  return (
    <motion.div
      className="app-gradient-bg flex h-screen w-screen flex-col items-center justify-center gap-4 rounded-2xl border border-[color:var(--panel-border)]"
      exit={{ opacity: 0 }}
    >
      <motion.img
        src={appLogo}
        alt="Serenity Hub"
        width={72}
        height={72}
        draggable={false}
        initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="h-[72px] w-[72px] select-none object-contain drop-shadow-lg"
        style={{ filter: "var(--logo-filter, none)" }}
      />
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-sm font-semibold tracking-tight text-[color:var(--text-primary)]"
      >
        Serenity Hub
      </motion.p>
    </motion.div>
  );
}
