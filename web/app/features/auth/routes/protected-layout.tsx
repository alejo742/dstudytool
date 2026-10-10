import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "~/features/auth/hooks/auth-provider";
import { AppShell } from "~/shared/components/layout/app-shell";

export default function ProtectedLayout() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingScreen />;

  if (status === "signed-out" || status === "domain-rejected") {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-rule border-t-ink animate-spin" />
    </div>
  );
}
