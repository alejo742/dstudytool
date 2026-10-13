import { Link } from "react-router";
import { motion } from "motion/react";
import { FileText, Milestone } from "lucide-react";
import type { NextAction, Plan } from "~/shared/types/domain";

export function PlanCard({
  plan,
  nextAction,
  index,
}: {
  plan: Plan;
  nextAction: NextAction | null;
  index: number;
}) {
  const progressLabel = buildProgressLabel(nextAction);
  const pct =
    nextAction && nextAction.modules_total > 0
      ? Math.round(
          (nextAction.modules_completed / nextAction.modules_total) * 100,
        )
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Link
        to={`/plans/${plan.id}`}
        className="group block bg-paper2 border-[1.5px] border-ink p-5 no-underline text-ink hover:shadow-brut-sm hover:-translate-y-[1px] transition-all"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {plan.course_code && (
              <p className="eyebrow mb-2">{plan.course_code}</p>
            )}
            <h3 className="font-head font-bold text-2xl text-ink leading-tight group-hover:text-blue transition">
              {plan.title}
            </h3>
            {plan.description && (
              <p className="text-ink2 mt-2 line-clamp-2 text-pretty">
                {plan.description}
              </p>
            )}
          </div>
          <ArrowGlyph />
        </div>

        {pct !== null && (
          <div className="mt-4">
            <div className="h-1.5 bg-paper border border-rule">
              <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-rule flex items-center gap-5 text-xs text-ink2 font-head font-semibold">
          <Stat
            icon={<FileText size={12} />}
            value={plan.upload_count}
            label="files"
          />
          <Stat
            icon={<Milestone size={12} />}
            value={progressLabel}
            label="progress"
          />
          <span className="ml-auto text-ink3 font-mono text-[11px]">
            {new Date(plan.updated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function buildProgressLabel(n: NextAction | null): string {
  if (!n) return "…";
  if (n.modules_total === 0) {
    if (n.kind === "upload_prompt") return "no material";
    return "not started";
  }
  return `${n.modules_completed}/${n.modules_total}`;
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      <span className="text-ink font-bold tabular-nums">{value}</span>
      <span className="text-ink3 uppercase tracking-wide">{label}</span>
    </span>
  );
}

function ArrowGlyph() {
  return (
    <span className="w-9 h-9 border-[1.5px] border-ink flex items-center justify-center text-ink2 bg-paper group-hover:bg-ink group-hover:text-paper transition shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
