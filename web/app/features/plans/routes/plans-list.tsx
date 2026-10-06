import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { Page, PageHeader } from "~/shared/components/layout/page";
import { EmptyState } from "~/shared/components/ui/empty-state";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { plansApi } from "~/features/plans/services/plans-api";
import { PlanCard } from "~/features/plans/components/plan-card";
import { CreatePlanInline } from "~/features/plans/components/create-plan-inline";
import type { Plan } from "~/shared/types/domain";
import { toast } from "sonner";

export function meta() {
  return [{ title: "Plans · Study tool" }];
}

export default function PlansListRoute() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const items = await plansApi.list();
      setPlans(items);
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
        <div className="p-4 rounded-md border border-red-100 bg-red-50 text-sm text-red-700 mb-6">
          {error}{" "}
          <button
            onClick={load}
            className="underline underline-offset-2 ml-1"
          >
            Try again
          </button>
        </div>
      )}

      {plans && plans.length === 0 && (
        <EmptyState
          icon={<BookOpen size={28} />}
          title="No plans yet"
          description="Start one for a course you're taking. You can upload materials in any format next."
          action={<CreatePlanInline onCreated={onCreated} />}
        />
      )}

      {plans && plans.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {plans.map((p, i) => (
            <PlanCard key={p.id} plan={p} index={i} />
          ))}
        </div>
      )}
    </Page>
  );
}
