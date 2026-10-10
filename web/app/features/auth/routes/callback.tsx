import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { getSupabase } from "~/shared/lib/supabase";
import { env } from "~/shared/lib/env";
import { motion } from "motion/react";

export function meta() {
  return [{ title: "Signing in..." }];
}

/**
 * Supabase handles the OAuth redirect under its own hosted domain and sends the
 * user back here with the session fragment or ?code=... We just wait for the
 * client to pick that up, verify the domain, and send the user along to `next`.
 */
export default function AuthCallbackRoute() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const next = params.get("next") ?? "/plans";

    const supabase = getSupabase();

    const finalize = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setMessage("That didn't work. Returning you to sign in…");
        setTimeout(() => navigate("/login", { replace: true }), 1200);
        return;
      }

      const user = data.session?.user;
      if (!user) {
        setTimeout(finalize, 150);
        return;
      }

      const email = user.email?.toLowerCase() ?? "";
      if (!email.endsWith(`@${env.ALLOWED_EMAIL_DOMAIN}`)) {
        await supabase.auth.signOut();
        navigate("/login?rejected=1", { replace: true });
        return;
      }

      navigate(next, { replace: true });
    };

    void finalize();
  }, [navigate, params]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto mb-6 w-10 h-10 border-2 border-rule border-t-ink animate-spin" />
        <p className="font-head text-ink2">{message}</p>
      </motion.div>
    </main>
  );
}
