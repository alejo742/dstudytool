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

      <div className="mb-8 p-5 bg-paper2 border-[1.5px] border-ink flex items-center gap-4">
        <div className="w-11 h-11 bg-ink text-paper flex items-center justify-center font-head font-bold text-lg">
          {(profile?.full_name ?? profile?.email ?? "?")[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-head font-semibold text-ink truncate">
            {profile?.full_name ?? "Dartmouth user"}
          </p>
          <p className="text-xs text-ink3 font-mono truncate">
            {profile?.email}
          </p>
        </div>
      </div>

      <ApiKeyCard />
    </Page>
  );
}
