import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { Page, PageHeader } from "~/shared/components/layout/page";
import { EmptyState } from "~/shared/components/ui/empty-state";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { plansApi } from "~/features/plans/services/plans-api";
import { PlanCard } from "~/features/plans/components/plan-card";
import { CreatePlanInline } from "~/features/plans/components/create-plan-inline";
import type { NextAction, Plan } from "~/shared/types/domain";

export function meta() {
  return [{ title: "Plans · Study tool" }];
}

export default function PlansListRoute() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [nextByPlan, setNextByPlan] = useState<Record<string, NextAction>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const items = await plansApi.list();
      setPlans(items);
      // Fetch next-action in parallel for progress badges. Any failure is
      // non-fatal; the card falls back to "…".
      const results = await Promise.allSettled(
        items.map((p) => plansApi.next(p.id).then((n) => [p.id, n] as const)),
      );
      const map: Record<string, NextAction> = {};
      for (const r of results) {
        if (r.status === "fulfilled") map[r.value[0]] = r.value[1];
      }
      setNextByPlan(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load plans");
      setPlans([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onCreated = (plan: Plan) => {
    setPlans((prev) => (prev ? [plan, ...prev] : [plan]));
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Your courses"
        title="Study plans"
        description="Each plan is one course. Upload everything you have for it, then study from it as long as you want."
        actions={<CreatePlanInline onCreated={onCreated} />}
      />

      {plans === null && (
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {error && (
        <div className="callout callout-red mb-6">
          <strong className="font-head mr-1">Error.</strong>
          {error}{" "}
          <button
            onClick={load}
            className="underline underline-offset-2 ml-1 text-ink font-semibold"
          >
            Try again
          </button>
        </div>
      )}

      {plans && plans.length === 0 && (
        <EmptyState
          icon={<BookOpen size={22} />}
          title="No plans yet"
          description="Start one for a course you're taking. You can upload materials in any format next."
          action={<CreatePlanInline onCreated={onCreated} />}
        />
      )}

      {plans && plans.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((p, i) => (
            <PlanCard
              key={p.id}
              plan={p}
              nextAction={nextByPlan[p.id] ?? null}
              index={i}
            />
          ))}
        </div>
      )}
    </Page>
  );
}
