import { motion } from "motion/react";
import type { Generation } from "~/shared/types/domain";
import { Badge } from "~/shared/components/ui/badge";

export function GenerationCard({ generation }: { generation: Generation }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="bg-paper2 border-[1.5px] border-ink"
    >
      <header className="flex items-center justify-between px-5 py-2 border-b border-ink bg-paper">
        <Badge tone="accent">{generation.kind}</Badge>
        <span className="text-xs text-ink3 font-mono">
          {new Date(generation.created_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </header>
      <div className="px-6 py-5 text-ink whitespace-pre-wrap leading-relaxed text-pretty">
        {generation.content}
      </div>
      {generation.sources.length > 0 && (
        <footer className="px-5 py-3 border-t border-rule bg-paper">
          <p className="eyebrow text-[11px] mb-2">Grounded in</p>
          <div className="flex flex-wrap gap-1.5">
            {generation.sources.map((s, i) => (
              <span
                key={i}
                className="text-xs text-ink2 bg-paper2 border border-rule px-2 py-0.5 font-mono"
              >
                {s}
              </span>
            ))}
          </div>
        </footer>
      )}
    </motion.article>
  );
}
