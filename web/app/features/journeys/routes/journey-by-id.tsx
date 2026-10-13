import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { JourneyShell } from "~/features/journeys/components/journey-shell";
import { journeyApi } from "~/features/journeys/services/journey-api";

export function meta() {
  return [{ title: "Journey · Study tool" }];
}

export default function JourneyByIdRoute() {
  const { journeyId } = useParams();
  const [returnTo, setReturnTo] = useState<string>("/plans");

  // Peek at the journey once to derive the correct back link (to its plan).
  // JourneyShell will fetch the journey again for its own state — this is a
  // cheap extra call, acceptable for the prototype.
  useEffect(() => {
    if (!journeyId) return;
    let cancelled = false;
    journeyApi
      .get(journeyId)
      .then((j) => {
        if (!cancelled) setReturnTo(`/plans/${j.plan_id}`);
      })
      .catch(() => {
        /* keep /plans fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [journeyId]);

  if (!journeyId) return null;
  return (
    <JourneyShell
      key={journeyId}
      bootstrap={() => journeyApi.get(journeyId)}
      returnTo={returnTo}
    />
  );
}
