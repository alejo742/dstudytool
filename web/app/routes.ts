import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("features/landing/routes/landing.tsx"),
  route("login", "features/auth/routes/login.tsx"),
  route("auth/callback", "features/auth/routes/callback.tsx"),

  layout("features/auth/routes/protected-layout.tsx", [
    route("plans", "features/plans/routes/plans-list.tsx"),
    route("plans/:planId", "features/plans/routes/plan-detail.tsx"),
    route("journeys/:journeyId", "features/journeys/routes/journey-by-id.tsx"),
    route("settings", "features/settings/routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
