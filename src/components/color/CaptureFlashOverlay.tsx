import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/state/appStore";

export function CaptureFlashOverlay() {
  const captureFlash = useAppStore((s) => s.captureFlash);

  return (
    <AnimatePresence>
      {captureFlash && (
        <motion.div
          key={captureFlash.token}
          className="pointer-events-none fixed inset-0 z-[350] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: captureFlash.hex }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.16, 0] }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="flex flex-col items-center gap-3"
          >
            <div
              className="h-24 w-24 rounded-3xl border-4 border-white/80 shadow-glass-lg"
              style={{ backgroundColor: captureFlash.hex, boxShadow: `0 0 60px 0 ${captureFlash.hex}66` }}
            />
            <span className="mono-tabular rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white shadow-glass">
              {captureFlash.hex.toUpperCase()}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
