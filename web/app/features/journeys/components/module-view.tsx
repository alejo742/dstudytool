import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "~/shared/components/ui/badge";
import { Button } from "~/shared/components/ui/button";
import { CheckpointCard } from "~/features/journeys/components/checkpoint-card";
import type { AttemptResult, ModuleDetail } from "~/shared/types/domain";

export function ModuleView({
  module,
  onSubmitAttempt,
  onComplete,
  completing,
  isLast,
}: {
  module: ModuleDetail;
  onSubmitAttempt: (
    checkpointId: string,
    answer: string,
  ) => Promise<AttemptResult>;
  onComplete: () => void;
  completing: boolean;
  isLast: boolean;
}) {
  const attemptedCount = module.checkpoints.filter(
    (c) => c.latest_attempt !== null,
  ).length;
  const canComplete =
    module.checkpoints.length > 0 && attemptedCount === module.checkpoints.length;

  return (
    <section className="flex flex-col gap-8">
      <header className="pb-6 border-b border-ink">
        <p className="eyebrow mb-2">Module {module.ordinal + 1}</p>
        <h1 className="font-head font-bold text-4xl md:text-5xl leading-[1] text-balance">
          {module.title}
        </h1>
        {module.concept_labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {module.concept_labels.map((c) => (
              <Badge key={c} tone="neutral">
                {c}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {module.key_extract ? (
        <article className="prose prose-sm max-w-none text-ink whitespace-pre-wrap leading-relaxed text-pretty">
          {module.key_extract}
        </article>
      ) : (
        <div className="text-ink3 italic">No extract available for this module.</div>
      )}

      {module.source_labels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="eyebrow text-[11px] mr-1 self-center">Grounded in</span>
          {module.source_labels.map((s) => (
            <span
              key={s}
              className="text-xs text-ink2 bg-paper2 border border-rule px-2 py-0.5 font-mono"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-5">
        <h2 className="font-head font-bold text-2xl leading-none">
          Checkpoints
        </h2>
        {module.checkpoints.map((c) => (
          <CheckpointCard
            key={c.id}
            checkpoint={c}
            onSubmit={onSubmitAttempt}
            disabled={completing}
          />
        ))}
      </div>

      <footer className="pt-6 border-t border-ink flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-ink2 font-mono tabular-nums">
          Attempted {attemptedCount} / {module.checkpoints.length}
        </p>
        <Button
          size="lg"
          onClick={onComplete}
          loading={completing}
          disabled={!canComplete}
          iconLeft={isLast ? <Sparkles size={16} /> : <ArrowRight size={16} />}
        >
          {isLast ? "Finish journey" : "Complete & continue"}
        </Button>
      </footer>
    </section>
  );
}
