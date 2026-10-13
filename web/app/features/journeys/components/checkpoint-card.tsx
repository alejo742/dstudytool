import { useState } from "react";
import { motion } from "motion/react";
import { Check, Sparkles, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "~/shared/components/ui/badge";
import { Button } from "~/shared/components/ui/button";
import { Textarea } from "~/shared/components/ui/input";
import type { AttemptResult, Checkpoint } from "~/shared/types/domain";
import { cn } from "~/shared/lib/cn";

const KIND_LABEL: Record<Checkpoint["kind"], string> = {
  "concept-check": "Concept check",
  problem: "Problem",
  "multiple-choice": "Multiple choice",
  "true-false-why": "True / false",
  "spot-the-error": "Spot the error",
  "complete-the-step": "Complete the step",
  "spaced-recall": "Spaced recall",
};

export function CheckpointCard({
  checkpoint,
  onSubmit,
  disabled,
}: {
  checkpoint: Checkpoint;
  onSubmit: (checkpointId: string, answer: string) => Promise<AttemptResult>;
  disabled?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AttemptResult | null>(
    checkpoint.latest_attempt,
  );
  const [submitting, setSubmitting] = useState(false);

  const isMcq = checkpoint.kind === "multiple-choice";
  const isSpaced = checkpoint.kind === "spaced-recall";
  const canSubmit = isMcq ? Boolean(picked) : answer.trim().length > 0;

  const submit = async () => {
    const payload = isMcq ? picked ?? "" : answer.trim();
    if (!payload) return;
    setSubmitting(true);
    try {
      const result = await onSubmit(checkpoint.id, payload);
      setAttempt(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Grading failed");
    } finally {
      setSubmitting(false);
    }
  };

  const scorePct = attempt ? Math.round(attempt.score * 100) : null;
  const passed = (attempt?.score ?? 0) >= 0.7;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-paper2 border-[1.5px]",
        isSpaced ? "border-blue" : "border-ink",
      )}
    >
      <header className="flex items-center justify-between px-5 py-2 border-b border-ink bg-paper">
        <div className="flex items-center gap-2">
          <Badge tone={isSpaced ? "accent" : "neutral"}>
            {KIND_LABEL[checkpoint.kind]}
          </Badge>
          {isSpaced && checkpoint.linked_concept_labels.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-head font-semibold text-blue uppercase tracking-wide">
              <Link2 size={11} />
              Reconnects: {checkpoint.linked_concept_labels.join(", ")}
            </span>
          )}
        </div>
        {attempt && (
          <Badge tone={passed ? "success" : "warning"}>
            {scorePct}% {passed ? "passed" : "try again"}
          </Badge>
        )}
      </header>

      <div className="px-6 py-5 text-ink whitespace-pre-wrap leading-relaxed text-pretty">
        {checkpoint.question}
      </div>

      <div className="px-6 pb-5 flex flex-col gap-3">
        {isMcq && checkpoint.choices ? (
          <div className="flex flex-col gap-2">
            {checkpoint.choices.map((c) => (
              <label
                key={c.id}
                className={cn(
                  "flex items-start gap-3 px-3 py-2 border-[1.5px] cursor-pointer transition",
                  picked === c.id
                    ? "border-ink bg-hl-wash/50"
                    : "border-rule bg-paper hover:border-ink",
                )}
              >
                <input
                  type="radio"
                  name={`cp-${checkpoint.id}`}
                  value={c.id}
                  checked={picked === c.id}
                  onChange={() => setPicked(c.id)}
                  disabled={disabled || submitting}
                  className="mt-1"
                />
                <span>
                  <span className="font-mono text-xs text-ink3 mr-2 uppercase">
                    {c.id}.
                  </span>
                  {c.text}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <Textarea
            rows={3}
            placeholder="Type your answer…"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={disabled || submitting}
          />
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={submit}
            loading={submitting}
            disabled={!canSubmit || disabled}
            iconLeft={attempt ? <Sparkles size={14} /> : <Check size={14} />}
            size="sm"
          >
            {attempt ? "Re-submit" : "Submit"}
          </Button>
          {attempt?.feedback && (
            <p className="text-sm text-ink2 text-pretty flex-1 min-w-0">
              {attempt.feedback}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}
