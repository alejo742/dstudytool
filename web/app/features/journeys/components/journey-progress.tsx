import type { Journey } from "~/shared/types/domain";

export function JourneyProgressBar({
  journey,
  currentOrdinal,
}: {
  journey: Journey;
  currentOrdinal: number;
}) {
  const total = journey.module_count || journey.modules.length || 1;
  const completed = journey.progress?.completed_module_ordinals.length ?? 0;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="mb-8">
      <div className="flex items-end justify-between mb-2">
        <p className="eyebrow">Journey</p>
        <p className="font-mono text-xs text-ink2 tabular-nums">
          Module {currentOrdinal + 1} / {total} · {pct}% complete
        </p>
      </div>
      <div className="flex gap-1 h-2">
        {Array.from({ length: total }, (_, i) => {
          const state = journey.progress?.completed_module_ordinals.includes(i)
            ? "done"
            : i === currentOrdinal
              ? "current"
              : "pending";
          return (
            <div
              key={i}
              className={
                state === "done"
                  ? "flex-1 bg-ink border border-ink"
                  : state === "current"
                    ? "flex-1 bg-hl-wash border border-ink"
                    : "flex-1 bg-paper2 border border-rule"
              }
              aria-label={`Module ${i + 1} ${state}`}
            />
          );
        })}
      </div>
    </div>
  );
}
