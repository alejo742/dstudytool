import { Button } from "~/shared/components/ui/button";
import { getSupabase } from "~/shared/lib/supabase";
import { env } from "~/shared/lib/env";
import { useState } from "react";
import { toast } from "sonner";

export function GoogleButton({ redirectAfter = "/plans" }: { redirectAfter?: string }) {
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    setLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Supabase will send users to its own callback, then back here.
        redirectTo: `${env.SITE_URL}/auth/callback?next=${encodeURIComponent(redirectAfter)}`,
        queryParams: {
          hd: env.ALLOWED_EMAIL_DOMAIN,
          prompt: "select_account",
        },
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
    // On success, browser is redirected away.
  };

  return (
    <Button
      onClick={signIn}
      loading={loading}
      size="lg"
      variant="primary"
      className="w-full"
    >
      <GoogleGlyph />
      Continue with Dartmouth Google
    </Button>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#FFFFFF"
        d="M21.6 12.227c0-.818-.073-1.602-.21-2.355H12v4.455h5.37a4.59 4.59 0 0 1-1.993 3.015v2.506h3.226c1.886-1.737 2.997-4.296 2.997-7.621z"
      />
      <path
        fill="#FFFFFF"
        d="M12 22c2.7 0 4.964-.896 6.615-2.42l-3.226-2.506c-.895.6-2.04.955-3.389.955-2.605 0-4.81-1.76-5.6-4.123H3.064v2.59A9.996 9.996 0 0 0 12 22z"
        opacity="0.9"
      />
      <path
        fill="#FFFFFF"
        d="M6.4 13.906a6.006 6.006 0 0 1 0-3.812V7.504H3.064a10 10 0 0 0 0 8.993L6.4 13.906z"
        opacity="0.8"
      />
      <path
        fill="#FFFFFF"
        d="M12 5.955c1.47 0 2.787.505 3.823 1.496l2.867-2.867C16.96 3.016 14.695 2 12 2A9.996 9.996 0 0 0 3.064 7.504L6.4 10.094C7.19 7.731 9.395 5.955 12 5.955z"
        opacity="0.7"
      />
    </svg>
  );
}
