import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Page } from "~/shared/components/layout/page";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { Button } from "~/shared/components/ui/button";
import { EmptyState } from "~/shared/components/ui/empty-state";
import { JourneyProgressBar } from "~/features/journeys/components/journey-progress";
import { ModuleView } from "~/features/journeys/components/module-view";
import { journeyApi } from "~/features/journeys/services/journey-api";
import { ApiError } from "~/shared/lib/api";
import type {
  AttemptResult,
  Journey,
  ModuleDetail,
} from "~/shared/types/domain";

const POLL_INTERVAL = 2500;

function parseModuleParam(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function JourneyShell({
  bootstrap,
  returnTo,
}: {
  /** Fetch or create the journey. Called once on mount. */
  bootstrap: () => Promise<Journey>;
  /** URL to navigate to when the journey completes or the user clicks Back. */
  returnTo: string;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedOrdinal = parseModuleParam(searchParams.get("module"));
  const [journey, setJourney] = useState<Journey | null>(null);
  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [currentOrdinal, setCurrentOrdinal] = useState(0);
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    bootstrap()
      .then((j) => {
        if (cancelled) return;
        setJourney(j);
        const seed =
          requestedOrdinal !== null
            ? Math.min(requestedOrdinal, Math.max(0, j.module_count - 1))
            : (j.progress?.current_module_ordinal ?? 0);
        setCurrentOrdinal(seed);
        if (j.status === "generating") scheduleRefresh(j.id);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not open journey";
        setBootError(msg);
      });
    return () => {
      cancelled = true;
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleRefresh = (journeyId: string) => {
    pollTimer.current = window.setTimeout(async () => {
      try {
        const fresh = await journeyApi.get(journeyId);
        setJourney(fresh);
        if (fresh.status === "generating") scheduleRefresh(journeyId);
      } catch (e) {
        console.warn(e);
        scheduleRefresh(journeyId);
      }
    }, POLL_INTERVAL);
  };

  useEffect(() => {
    if (!journey || journey.status !== "ready") return;
    let cancelled = false;
    setModuleLoading(true);
    setModule(null);
    journeyApi
      .getModule(journey.id, currentOrdinal)
      .then((m) => {
        if (!cancelled) setModule(m);
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(
            e instanceof Error ? e.message : "Could not load module",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setModuleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [journey, currentOrdinal]);

  const back = (
    <Link
      to={returnTo}
      className="inline-flex items-center gap-1 font-head font-semibold text-sm text-ink2 hover:text-ink no-underline mb-4"
    >
      <ArrowLeft size={14} /> Back
    </Link>
  );

  if (bootError) {
    return (
      <Page className="max-w-3xl">
        {back}
        <EmptyState
          title="Journey could not open"
          description={bootError}
          action={
            <Link to={returnTo} className="btn btn-pri no-underline">
              Back
            </Link>
          }
        />
      </Page>
    );
  }

  if (!journey) {
    return (
      <Page className="max-w-3xl">
        {back}
        <Skeleton className="h-12 w-80 mb-4" />
        <Skeleton className="h-6 w-96" />
      </Page>
    );
  }

  if (journey.status === "generating") {
    return (
      <Page className="max-w-3xl">
        {back}
        <div className="pb-6 mb-8 border-b border-ink">
          <p className="eyebrow mb-2">Preparing your journey</p>
          <h1 className="font-head font-bold text-4xl md:text-5xl leading-[1] text-balance">
            {journey.title}
          </h1>
          <p className="text-ink2 mt-3 text-pretty max-w-xl">
            Reading your material and breaking it into modules. This typically
            takes under a minute.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10 w-11/12" />
          <Skeleton className="h-10 w-9/12" />
        </div>
      </Page>
    );
  }

  if (journey.status === "failed") {
    return (
      <Page className="max-w-3xl">
        {back}
        <EmptyState
          title="Journey generation failed"
          description={
            journey.error ?? "Something went wrong talking to the model."
          }
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      </Page>
    );
  }

  const handleSubmit = async (
    checkpointId: string,
    answer: string,
  ): Promise<AttemptResult> => {
    const result = await journeyApi.submitAttempt(
      journey.id,
      currentOrdinal,
      checkpointId,
      answer,
    );
    setModule((prev) =>
      prev
        ? {
            ...prev,
            checkpoints: prev.checkpoints.map((c) =>
              c.id === checkpointId ? { ...c, latest_attempt: result } : c,
            ),
          }
        : prev,
    );
    return result;
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await journeyApi.complete(journey.id, currentOrdinal);
      setJourney((prev) => (prev ? { ...prev, progress: res.progress } : prev));
      if (res.journey_complete) {
        toast.success("Journey complete.");
        navigate(returnTo);
        return;
      }
      if (res.next_module_ordinal !== null) {
        setCurrentOrdinal(res.next_module_ordinal);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not advance");
    } finally {
      setCompleting(false);
    }
  };

  const isLast = currentOrdinal >= journey.module_count - 1;

  return (
    <Page className="max-w-3xl">
      {back}
      <JourneyProgressBar journey={journey} currentOrdinal={currentOrdinal} />

      {moduleLoading || !module ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-32" />
          <Skeleton className="h-20" />
        </div>
      ) : (
        <ModuleView
          module={module}
          onSubmitAttempt={handleSubmit}
          onComplete={handleComplete}
          completing={completing}
          isLast={isLast}
        />
      )}

      {journey.modules.length > 0 && (
        <nav className="mt-10 pt-6 border-t border-rule flex flex-wrap gap-2">
          {journey.modules.map((m) => {
            const isCurrent = m.ordinal === currentOrdinal;
            const isDone = journey.progress?.completed_module_ordinals.includes(
              m.ordinal,
            );
            const unlocked =
              m.ordinal <= (journey.progress?.current_module_ordinal ?? 0);
            return (
              <button
                key={m.id}
                disabled={!unlocked || moduleLoading || completing}
                onClick={() => setCurrentOrdinal(m.ordinal)}
                className={
                  isCurrent
                    ? "px-2 h-8 border-[1.5px] border-ink bg-ink text-paper text-xs font-head font-semibold"
                    : isDone
                      ? "px-2 h-8 border-[1.5px] border-ink bg-paper2 text-ink text-xs font-head font-semibold hover:bg-hl-wash"
                      : unlocked
                        ? "px-2 h-8 border-[1.5px] border-rule bg-paper text-ink2 text-xs font-head font-semibold hover:border-ink"
                        : "px-2 h-8 border-[1.5px] border-rule bg-paper text-ink3 text-xs font-head font-semibold opacity-50 cursor-not-allowed"
                }
                title={m.title}
              >
                {m.ordinal + 1}
              </button>
            );
          })}
        </nav>
      )}
    </Page>
  );
}
