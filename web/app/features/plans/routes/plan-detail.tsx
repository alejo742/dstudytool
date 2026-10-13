import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Page, PageHeader } from "~/shared/components/layout/page";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { Button } from "~/shared/components/ui/button";
import { plansApi } from "~/features/plans/services/plans-api";
import { journeyApi } from "~/features/journeys/services/journey-api";
import { JourneyPath } from "~/features/journeys/components/journey-path";
import { UploadsPanel } from "~/features/uploads/components/uploads-panel";
import type { Journey, NextAction, Plan } from "~/shared/types/domain";
import { cn } from "~/shared/lib/cn";

export function meta() {
  return [{ title: `Plan · Study tool` }];
}

const POLL_INTERVAL = 2500;

export default function PlanDetailRoute() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [starting, setStarting] = useState(false);
  const [uploadsReady, setUploadsReady] = useState(0);
  const [uploadsTotal, setUploadsTotal] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const materialsAutoSet = useRef(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const journeyPollTimer = useRef<number | null>(null);

  const refreshNext = async (id: string): Promise<NextAction | null> => {
    try {
      const n = await plansApi.next(id);
      setNextAction(n);
      return n;
    } catch (e) {
      console.warn("next action fetch failed", e);
      return null;
    }
  };

  const refreshJourney = async (journeyId: string): Promise<Journey | null> => {
    try {
      const j = await journeyApi.get(journeyId);
      setJourney(j);
      return j;
    } catch (e) {
      console.warn("journey fetch failed", e);
      return null;
    }
  };

  useEffect(() => {
    if (!planId) return;
    plansApi
      .get(planId)
      .then(setPlan)
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Could not load plan"),
      );
    void refreshNext(planId).then((n) => {
      if (n?.journey_id) void refreshJourney(n.journey_id);
    });
    return () => {
      if (journeyPollTimer.current) window.clearTimeout(journeyPollTimer.current);
    };
  }, [planId]);

  useEffect(() => {
    if (!nextAction || materialsAutoSet.current) return;
    materialsAutoSet.current = true;
    if (nextAction.kind === "upload_prompt") setMaterialsOpen(true);
  }, [nextAction]);

  // Poll the journey while it's generating so the path fills in automatically.
  useEffect(() => {
    if (!journey || journey.status !== "generating") return;
    journeyPollTimer.current = window.setTimeout(async () => {
      const fresh = await refreshJourney(journey.id);
      if (fresh && fresh.status === "ready" && planId) {
        void refreshNext(planId);
      }
    }, POLL_INTERVAL);
    return () => {
      if (journeyPollTimer.current) window.clearTimeout(journeyPollTimer.current);
    };
  }, [journey, planId]);

  if (!planId) return null;

  const remove = async () => {
    if (!plan) return;
    if (
      !confirm(
        `Delete "${plan.title}"? This removes all uploads and journeys.`,
      )
    )
      return;
    setDeleting(true);
    try {
      await plansApi.remove(plan.id);
      toast.success("Plan deleted");
      navigate("/plans", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  };

  const scrollToDropzone = () => {
    setMaterialsOpen(true);
    requestAnimationFrame(() => {
      dropzoneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const startJourney = async () => {
    if (!planId) return;
    setStarting(true);
    try {
      const j = await journeyApi.create(planId);
      setJourney(j);
      await refreshNext(planId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start journey");
    } finally {
      setStarting(false);
    }
  };

  const handlePickNode = (ordinal: number) => {
    if (!journey) return;
    navigate(`/journeys/${journey.id}?module=${ordinal}`);
  };

  return (
    <Page>
      <Link
        to="/plans"
        className="inline-flex items-center gap-1 font-head font-semibold text-sm text-ink2 hover:text-ink no-underline mb-4"
      >
        <ArrowLeft size={14} /> All plans
      </Link>

      {!plan ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-80" />
          <Skeleton className="h-6 w-96" />
        </div>
      ) : (
        <PageHeader
          eyebrow={plan.course_code ?? "Study plan"}
          title={plan.title}
          description={plan.description ?? undefined}
          actions={
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              onClick={remove}
              loading={deleting}
            >
              Delete
            </Button>
          }
        />
      )}

      {/* Primary surface — path when a journey exists, CTA card otherwise. */}
      <PrimarySurface
        nextAction={nextAction}
        journey={journey}
        starting={starting}
        onStart={startJourney}
        onPickNode={handlePickNode}
        onUploadPrompt={scrollToDropzone}
      />

      {/* Materials — collapsible, below the fold */}
      <section className="mt-10">
        <button
          type="button"
          onClick={() => setMaterialsOpen((v) => !v)}
          className="flex items-center gap-2 font-head font-bold text-2xl leading-none text-ink hover:text-ink2 transition"
        >
          {materialsOpen ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
          Materials
          {uploadsTotal > 0 && (
            <span className="font-mono text-sm text-ink3 font-semibold tabular-nums ml-1">
              {uploadsReady}/{uploadsTotal} ready
            </span>
          )}
        </button>

        {materialsOpen && (
          <div ref={dropzoneRef} className="mt-4">
            <UploadsPanel
              planId={planId}
              onCountChange={(ready, total) => {
                setUploadsReady(ready);
                setUploadsTotal(total);
                if (planId) void refreshNext(planId);
              }}
            />
          </div>
        )}
      </section>
    </Page>
  );
}

function PrimarySurface({
  nextAction,
  journey,
  starting,
  onStart,
  onPickNode,
  onUploadPrompt,
}: {
  nextAction: NextAction | null;
  journey: Journey | null;
  starting: boolean;
  onStart: () => void;
  onPickNode: (ordinal: number) => void;
  onUploadPrompt: () => void;
}) {
  if (!nextAction) {
    return <Skeleton className="h-40" />;
  }

  // Pre-journey states → CTA card
  if (nextAction.kind === "upload_prompt") {
    return (
      <CTACard
        eyebrow="Add material"
        title="Add material to get started"
        sublabel="Drop a PDF or set of notes below."
        buttonLabel="Add material"
        icon={<Upload size={16} />}
        onClick={onUploadPrompt}
      />
    );
  }

  if (nextAction.kind === "start_journey") {
    return (
      <CTACard
        eyebrow="Begin"
        title="Start your journey"
        sublabel={nextAction.sublabel ?? ""}
        buttonLabel={starting ? "Outlining…" : "Start journey"}
        icon={<ArrowRight size={16} />}
        onClick={onStart}
        loading={starting}
      />
    );
  }

  // continue_journey / all_done — path visible if we have one
  if (!journey) {
    return <Skeleton className="h-40" />;
  }

  if (journey.status === "generating") {
    return (
      <article className="border-[1.5px] border-ink bg-paper2 px-6 py-8 flex flex-col gap-5">
        <div>
          <p className="eyebrow mb-2">Outlining your course</p>
          <h2 className="font-head font-bold text-2xl leading-tight text-ink">
            {journey.title}
          </h2>
          <p className="text-ink2 mt-2">
            Reading your material and planning the path. This usually takes
            under a minute.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="w-14 h-14 rounded-full border-[1.5px] border-dashed border-rule"
              aria-hidden
            />
          ))}
        </div>
      </article>
    );
  }

  if (journey.status === "failed") {
    return (
      <CTACard
        eyebrow="Problem"
        title="Journey generation failed"
        sublabel={journey.error ?? "Something went wrong talking to the model."}
        buttonLabel="Retry"
        icon={<ArrowRight size={16} />}
        onClick={onStart}
        loading={starting}
      />
    );
  }

  // Ready → the zig-zag path
  const current = nextAction.module_ordinal ?? 0;
  const completed = journey.progress?.completed_module_ordinals ?? [];
  const isDone = nextAction.kind === "all_done";

  return (
    <article className="border-[1.5px] border-ink bg-paper2 px-6 py-6">
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <p className="eyebrow mb-2">
            {isDone ? "Complete" : "Continue"}
          </p>
          <h2 className="font-head font-bold text-2xl leading-tight text-ink text-balance">
            {isDone ? "You've finished every module." : journey.title}
          </h2>
          {!isDone && (
            <p className="text-ink2 mt-1 font-mono text-sm tabular-nums">
              Module {current + 1} of {journey.module_count}
              {" · "}
              {Math.round(
                ((completed.length) / Math.max(journey.module_count, 1)) * 100,
              )}
              % complete
            </p>
          )}
          {isDone && (
            <p className="text-ink2 mt-1 text-pretty max-w-xl">
              Add more material to extend the path.
            </p>
          )}
        </div>
        {isDone && (
          <span className="w-10 h-10 bg-ink text-paper flex items-center justify-center">
            <CheckCircle2 size={20} />
          </span>
        )}
      </div>
      <JourneyPath
        modules={journey.modules}
        currentOrdinal={current}
        completedOrdinals={completed}
        onPick={onPickNode}
      />
    </article>
  );
}

function CTACard({
  eyebrow,
  title,
  sublabel,
  buttonLabel,
  icon,
  onClick,
  loading,
}: {
  eyebrow: string;
  title: string;
  sublabel?: string;
  buttonLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <article
      className={cn(
        "border-[1.5px] border-ink bg-paper2 px-6 py-6",
        "flex items-start justify-between gap-4 flex-wrap",
      )}
    >
      <div className="min-w-0">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 className="font-head font-bold text-3xl leading-[1.05] text-balance text-ink">
          {title}
        </h2>
        {sublabel && (
          <p className="text-ink2 mt-2 text-pretty">{sublabel}</p>
        )}
      </div>
      <Button size="lg" onClick={onClick} loading={loading} iconRight={icon}>
        {buttonLabel}
      </Button>
    </article>
  );
}
