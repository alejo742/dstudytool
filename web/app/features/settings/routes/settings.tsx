import { Page, PageHeader } from "~/shared/components/layout/page";
import { ApiKeyCard } from "~/features/settings/components/api-key-card";
import { useAuth } from "~/features/auth/hooks/auth-provider";

export function meta() {
  return [{ title: "Settings · Study tool" }];
}

export default function SettingsRoute() {
  const { profile } = useAuth();
  return (
    <Page className="max-w-3xl">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Signed in as the Dartmouth account below. Add your Dartmouth Chat key to enable generation."
      />

      <div className="mb-8 p-5 rounded-xl border border-ink-200/70 bg-white flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-ink-900 text-ink-50 flex items-center justify-center font-medium">
          {(profile?.full_name ?? profile?.email ?? "?")[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900 truncate">
            {profile?.full_name ?? "Dartmouth user"}
          </p>
          <p className="text-xs text-ink-500 font-mono truncate">
            {profile?.email}
          </p>
        </div>
      </div>

      <ApiKeyCard />
    </Page>
  );
}
