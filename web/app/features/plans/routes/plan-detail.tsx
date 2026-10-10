import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Page, PageHeader } from "~/shared/components/layout/page";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { Badge } from "~/shared/components/ui/badge";
import { Button } from "~/shared/components/ui/button";
import { plansApi } from "~/features/plans/services/plans-api";
import { UploadsPanel } from "~/features/uploads/components/uploads-panel";
import type { Plan } from "~/shared/types/domain";

export function meta() {
  return [{ title: `Plan · Study tool` }];
}

export default function PlanDetailRoute() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [readyCount, setReadyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!planId) return;
    plansApi
      .get(planId)
      .then(setPlan)
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Could not load plan"),
      );
  }, [planId]);

  if (!planId) return null;

  const canStudy = readyCount > 0;

  const remove = async () => {
    if (!plan) return;
    if (
      !confirm(
        `Delete "${plan.title}"? This removes all uploads and generated material.`,
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
          description={plan.description ?? "Upload your course material, then study from it."}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                iconLeft={<Trash2 size={14} />}
                onClick={remove}
                loading={deleting}
              >
                Delete
              </Button>
              <Link
                to={canStudy ? `/plans/${plan.id}/study` : "#"}
                aria-disabled={!canStudy}
                className={[
                  "btn btn-pri no-underline",
                  canStudy ? "" : "opacity-45 pointer-events-none",
                ].join(" ")}
              >
                <Play size={14} />
                Study
              </Link>
            </div>
          }
        />
      )}

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-10">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-head font-bold text-2xl leading-none">
              Materials
            </h2>
            {totalCount > 0 && (
              <Badge tone="neutral">
                {readyCount}/{totalCount} ready
              </Badge>
            )}
          </div>
          <UploadsPanel
            planId={planId}
            onCountChange={(ready, total) => {
              setReadyCount(ready);
              setTotalCount(total);
            }}
          />
        </section>

        <aside>
          <h2 className="font-head font-bold text-2xl leading-none mb-4">
            About this plan
          </h2>
          <div className="bg-paper2 border-[1.5px] border-ink">
            <Row label="Files uploaded" value={plan?.upload_count ?? 0} />
            <Row label="Chunks extracted" value={plan?.extracted_chunk_count ?? 0} />
            <Row label="Practice generated" value={plan?.generation_count ?? 0} />
          </div>

          <div className="callout callout-blue mt-5">
            <strong className="font-head block mb-1 text-ink">
              Needs your Dartmouth Chat key
            </strong>
            Generation uses Dartmouth-hosted models with your personal key.{" "}
            <Link
              to="/settings"
              className="text-blue underline underline-offset-2 font-semibold"
            >
              Add it in settings
            </Link>
            .
          </div>
        </aside>
      </div>
    </Page>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-rule last:border-b-0">
      <span className="font-head font-semibold text-ink2 uppercase tracking-wide text-xs">
        {label}
      </span>
      <span className="font-mono text-sm text-ink font-semibold tabular-nums">
        {value}
      </span>
    </div>
  );
}
