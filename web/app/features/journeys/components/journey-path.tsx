import { motion } from "motion/react";
import { Check, Lock } from "lucide-react";
import type { JourneyModuleSummary } from "~/shared/types/domain";
import { cn } from "~/shared/lib/cn";

type NodeState = "done" | "current" | "unlocked" | "locked";

const ROW = 4;

/**
 * Duolingo-style path. Nodes wrap into rows of ROW; alternating rows reverse
 * direction so the eye zig-zags down the page. The current node is the only
 * one with a pulse; previously-done nodes are clickable to revisit.
 */
export function JourneyPath({
  modules,
  currentOrdinal,
  completedOrdinals,
  onPick,
}: {
  modules: JourneyModuleSummary[];
  currentOrdinal: number;
  completedOrdinals: number[];
  onPick: (ordinal: number) => void;
}) {
  const completedSet = new Set(completedOrdinals);
  const maxUnlocked = Math.max(currentOrdinal, ...completedOrdinals, 0);
  const rows: JourneyModuleSummary[][] = [];
  for (let i = 0; i < modules.length; i += ROW) {
    const slice = modules.slice(i, i + ROW);
    rows.push(slice);
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      {rows.map((rowModules, rowIndex) => {
        const reverse = rowIndex % 2 === 1;
        return (
          <div
            key={rowIndex}
            className={cn(
              "flex items-center justify-between gap-3",
              reverse ? "flex-row-reverse" : "flex-row",
            )}
          >
            {rowModules.map((m) => {
              const state: NodeState = completedSet.has(m.ordinal)
                ? "done"
                : m.ordinal === currentOrdinal
                  ? "current"
                  : m.ordinal <= maxUnlocked
                    ? "unlocked"
                    : "locked";
              return (
                <PathNode
                  key={m.id}
                  module={m}
                  state={state}
                  onPick={() => onPick(m.ordinal)}
                />
              );
            })}
            {/* fillers to keep the zig-zag spacing stable on short rows */}
            {Array.from({ length: ROW - rowModules.length }).map((_, k) => (
              <span key={`filler-${k}`} className="w-14 h-14" aria-hidden />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function PathNode({
  module,
  state,
  onPick,
}: {
  module: JourneyModuleSummary;
  state: NodeState;
  onPick: () => void;
}) {
  const disabled = state === "locked";
  const label = `${module.ordinal + 1}. ${module.title}`;

  return (
    <div className="relative group">
      {state === "current" && (
        <motion.span
          className="absolute inset-0 rounded-full border-[1.5px] border-ink"
          animate={{ scale: [1, 1.25, 1], opacity: [0.9, 0, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          aria-hidden
        />
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={onPick}
        title={label}
        aria-label={label}
        className={cn(
          "relative w-14 h-14 rounded-full border-[1.5px] font-head font-bold text-base flex items-center justify-center transition shadow-brut-sm",
          state === "done" &&
            "bg-ink text-paper border-ink hover:translate-y-[-1px] cursor-pointer",
          state === "current" &&
            "bg-hl text-ink border-ink cursor-pointer",
          state === "unlocked" &&
            "bg-paper2 text-ink border-ink hover:bg-hl-wash cursor-pointer",
          state === "locked" &&
            "bg-paper border-dashed border-rule text-ink3 cursor-not-allowed opacity-70",
        )}
      >
        {state === "done" ? (
          <Check size={18} strokeWidth={3} />
        ) : state === "locked" ? (
          <Lock size={14} />
        ) : (
          module.ordinal + 1
        )}
      </button>

      {/* tooltip on hover for sighted users */}
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2",
          "text-[11px] font-head font-semibold px-2 py-1 whitespace-nowrap",
          "bg-ink text-paper opacity-0 group-hover:opacity-100 transition-opacity",
        )}
      >
        {module.title}
      </span>
    </div>
  );
}
