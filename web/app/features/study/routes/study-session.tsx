import { Link, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, RotateCcw } from "lucide-react";
import { Page } from "~/shared/components/layout/page";
import { Button } from "~/shared/components/ui/button";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { GenerationCard } from "~/features/study/components/generation-card";
import {
  studyApi,
  type GenerationKind,
} from "~/features/study/services/study-api";
import type { Generation } from "~/shared/types/domain";
import { cn } from "~/shared/lib/cn";

export function meta() {
  return [{ title: "Study · Study tool" }];
}

const KINDS: { value: GenerationKind; label: string }[] = [
  { value: "mixed", label: "Mixed" },
  { value: "problem", label: "Problem" },
  { value: "concept-check", label: "Concept check" },
  { value: "walkthrough", label: "Walkthrough" },
];

export default function StudySessionRoute() {
  const { planId } = useParams();
  const [items, setItems] = useState<Generation[] | null>(null);
  const [kind, setKind] = useState<GenerationKind>("mixed");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!planId) return;
    studyApi
      .history(planId, 10)
      .then(setItems)
      .catch(() => setItems([]));
  }, [planId]);

  if (!planId) return null;

  const generate = async () => {
    setLoading(true);
    try {
      const gen = await studyApi.next(planId, kind);
      setItems((prev) => (prev ? [gen, ...prev] : [gen]));
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page className="max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link
          to={`/plans/${planId}`}
          className="inline-flex items-center gap-1 font-head font-semibold text-sm text-ink2 hover:text-ink no-underline"
        >
          <ArrowLeft size={14} /> Back to plan
        </Link>
        <div className="flex items-center gap-0 border-[1.5px] border-ink">
          {KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              className={cn(
                "px-3 h-8 font-head font-semibold text-sm border-r border-ink last:border-r-0 transition",
                kind === k.value
                  ? "bg-ink text-paper"
                  : "bg-paper2 text-ink2 hover:bg-hl-wash hover:text-ink",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <header className="mb-8 pb-6 border-b border-ink">
        <p className="eyebrow mb-2">Study session</p>
        <h1 className="font-head font-bold text-5xl text-balance leading-[1]">
          One at a time, from your material.
        </h1>
        <p className="text-ink2 mt-3 text-pretty max-w-xl">
          Each request pulls from the material you uploaded. No two generations
          repeat.
        </p>
      </header>

      <div className="flex items-center gap-3 mb-10 flex-wrap">
        <Button
          size="lg"
          onClick={generate}
          loading={loading}
          iconLeft={<Sparkles size={16} />}
        >
          {items && items.length === 0 ? "Generate first problem" : "Next"}
        </Button>
        {items && items.length > 0 && (
          <Button
            variant="secondary"
            onClick={generate}
            loading={loading}
            iconLeft={<RotateCcw size={14} />}
          >
            Another like this
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex flex-col gap-6">
        {items === null && (
          <>
            <Skeleton className="h-40" />
            <Skeleton className="h-32" />
          </>
        )}

        {items && items.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 border-[1.5px] border-dashed border-ink bg-paper2"
          >
            <p className="font-head font-bold text-2xl text-ink leading-none">
              Nothing generated yet
            </p>
            <p className="text-ink2 mt-3 max-w-sm mx-auto">
              Hit the button above to pull your first grounded practice item.
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {items?.map((g) => (
            <GenerationCard key={g.id} generation={g} />
          ))}
        </AnimatePresence>
      </div>
    </Page>
  );
}
