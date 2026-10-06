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
      className="bg-white border border-ink-200/70 rounded-xl p-7"
    >
      <header className="flex items-center justify-between mb-4">
        <Badge tone="accent">{generation.kind}</Badge>
        <span className="text-xs text-ink-400 font-mono">
          {new Date(generation.created_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </header>
      <div className="prose prose-sm max-w-none text-ink-900 whitespace-pre-wrap font-sans leading-relaxed text-pretty">
        {generation.content}
      </div>
      {generation.sources.length > 0 && (
        <footer className="mt-5 pt-4 border-t border-ink-100">
          <p className="text-xs tracking-wider uppercase text-ink-400 mb-2">
            Grounded in
          </p>
          <div className="flex flex-wrap gap-1.5">
            {generation.sources.map((s, i) => (
              <span
                key={i}
                className="text-xs text-ink-500 bg-ink-100 px-2 py-0.5 rounded"
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
