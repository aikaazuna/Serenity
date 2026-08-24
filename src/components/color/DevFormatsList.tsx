import { motion } from "framer-motion";
import type { ColorSnapshot } from "@shared/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { CopyRow } from "./CopyRow";
import { getDeveloperFormats } from "@/lib/color/formats";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function DevFormatsList({ color }: { color: ColorSnapshot }) {
  const formats = getDeveloperFormats(color);

  return (
    <GlassCard className="p-4">
      <h3 className="mb-3 text-[13px] font-semibold text-[color:var(--text-primary)]">Formats développeurs</h3>
      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-2">
        {formats.map((format) => (
          <motion.div key={format.id} variants={item}>
            <CopyRow label={format.label} value={format.value} multiline />
          </motion.div>
        ))}
      </motion.div>
    </GlassCard>
  );
}
