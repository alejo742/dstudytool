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

export function meta({ params }: { params: { planId?: string } }) {
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
    if (!confirm(`Delete "${plan.title}"? This removes all uploads and generated material.`)) return;
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
        className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900 transition mb-4"
      >
        <ArrowLeft size={12} /> All plans
      </Link>

      {!plan ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-80" />
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
                variant="ghost"
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
                  "inline-flex items-center gap-2 h-10 px-4 rounded-md text-sm font-medium transition active:scale-[0.98]",
                  canStudy
                    ? "bg-ink-900 text-ink-50 hover:bg-ink-800"
                    : "bg-ink-100 text-ink-400 cursor-not-allowed pointer-events-none",
                ].join(" ")}
              >
                <Play size={14} />
                Study
              </Link>
            </div>
          }
        />
      )}

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="font-serif text-xl">Materials</h2>
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
          <h2 className="font-serif text-xl mb-4">About this plan</h2>
          <div className="bg-white border border-ink-200/70 rounded-lg divide-y divide-ink-100 text-sm">
            <Row label="Files uploaded" value={plan?.upload_count ?? 0} />
            <Row label="Chunks extracted" value={plan?.extracted_chunk_count ?? 0} />
            <Row label="Practice generated" value={plan?.generation_count ?? 0} />
          </div>

          <div className="mt-6 p-4 rounded-lg border border-ink-200/70 bg-ink-50 text-sm text-ink-500 text-pretty">
            <strong className="text-ink-900 block mb-1">
              Needs your Dartmouth Chat key
            </strong>
            Generation uses Dartmouth-hosted models with your personal key.
            <Link
              to="/settings"
              className="inline-block ml-1 text-ink-900 underline underline-offset-2"
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
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900 font-mono text-xs">{value}</span>
    </div>
  );
}
