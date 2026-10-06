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
      <div className="flex items-center justify-between mb-6">
        <Link
          to={`/plans/${planId}`}
          className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900 transition"
        >
          <ArrowLeft size={12} /> Back to plan
        </Link>
        <div className="flex items-center gap-1 p-1 bg-ink-100 rounded-md">
          {KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              className={cn(
                "px-3 h-7 text-xs rounded transition",
                kind === k.value
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-900",
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>

      <header className="mb-8">
        <h1 className="font-serif text-4xl text-balance">Study session</h1>
        <p className="text-ink-500 mt-2 text-pretty">
          Each request pulls from the material you uploaded. No two generations repeat.
        </p>
      </header>

      <div className="flex items-center gap-3 mb-10">
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
            variant="ghost"
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
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        )}

        {items && items.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 border border-dashed border-ink-200 rounded-xl"
          >
            <p className="font-serif text-xl text-ink-900">Nothing generated yet</p>
            <p className="text-sm text-ink-500 mt-2 max-w-sm mx-auto">
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
