import { motion } from "framer-motion";
import { useI18n } from '@/hooks/useI18n';
import type { ColorSnapshot } from "@shared/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { CopyRow } from "./CopyRow";
import { getPrimaryFormats } from "@/lib/color/formats";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function ColorFormatsList({ color }: { color: ColorSnapshot }) {
  const t = useI18n();
  const formats = getPrimaryFormats(color);

  return (
    <GlassCard className="p-4">
      <h3 className="mb-3 text-[13px] font-semibold text-[color:var(--text-primary)]">{t.colorHero.formats}</h3>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-2"
      >
        {formats.map((format) => (
          <motion.div key={format.id} variants={item}>
            <CopyRow label={format.label} value={format.value} />
          </motion.div>
        ))}
      </motion.div>
    </GlassCard>
  );
}
