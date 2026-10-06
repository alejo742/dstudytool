import { Link } from "react-router";
import { motion } from "motion/react";
import { FileText, Sparkles } from "lucide-react";
import type { Plan } from "~/shared/types/domain";

export function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Link
        to={`/plans/${plan.id}`}
        className="group block bg-white border border-ink-200/70 rounded-lg p-5 hover:border-ink-900 transition"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {plan.course_code && (
              <p className="text-xs tracking-[0.15em] uppercase text-ink-400 mb-2">
                {plan.course_code}
              </p>
            )}
            <h3 className="font-serif text-xl text-ink-900 group-hover:text-accent-700 transition">
              {plan.title}
            </h3>
            {plan.description && (
              <p className="text-sm text-ink-500 mt-1 line-clamp-2 text-pretty">
                {plan.description}
              </p>
            )}
          </div>
          <ArrowGlyph />
        </div>
        <div className="mt-5 pt-4 border-t border-ink-100 flex items-center gap-5 text-xs text-ink-500">
          <Stat icon={<FileText size={12} />} value={plan.upload_count} label="files" />
          <Stat
            icon={<Sparkles size={12} />}
            value={plan.generation_count}
            label="generated"
          />
          <span className="ml-auto text-ink-400">
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

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      <span className="font-medium text-ink-700">{value}</span>
      <span>{label}</span>
    </span>
  );
}

function ArrowGlyph() {
  return (
    <span className="w-8 h-8 rounded-md border border-ink-200 flex items-center justify-center text-ink-400 group-hover:bg-ink-900 group-hover:text-ink-50 group-hover:border-ink-900 transition">
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
