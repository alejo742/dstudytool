import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "~/features/auth/hooks/auth-provider";
import { GoogleButton } from "~/features/auth/components/google-button";
import { env } from "~/shared/lib/env";

export function meta() {
  return [{ title: "Sign in · Study tool" }];
}

export default function LoginRoute() {
  const { status, rejectedEmail } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") ?? "/plans";

  useEffect(() => {
    if (status === "signed-in") navigate(next, { replace: true });
  }, [status, next, navigate]);

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <Link
            to="/"
            className="eyebrow hover:text-ink no-underline"
          >
            ← Back
          </Link>
          <h1 className="font-head font-bold text-5xl mt-6 text-balance leading-[1]">
            Sign in to continue
          </h1>
          <p className="text-ink2 mt-3 text-pretty">
            Study tool is restricted to Dartmouth email addresses
            <span className="font-mono text-ink"> (@{env.ALLOWED_EMAIL_DOMAIN})</span>.
          </p>

          <div className="mt-10">
            <GoogleButton redirectAfter={next} />
          </div>

          {status === "domain-rejected" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="callout callout-red mt-6"
            >
              <strong className="font-head block text-ink">
                {rejectedEmail ?? "That account"} isn't a Dartmouth address.
              </strong>
              Sign in with your <code>@{env.ALLOWED_EMAIL_DOMAIN}</code> Google
              account to continue.
            </motion.div>
          )}

          <p className="text-xs text-ink3 mt-10 text-pretty font-head">
            We only ever request your name, email, and avatar from Google.
          </p>
        </motion.div>
      </section>

      <aside className="hidden lg:flex items-center justify-center bg-ink text-paper relative overflow-hidden">
        <AuthBackdrop />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative max-w-sm px-12 text-center"
        >
          <p className="font-head font-semibold text-sm tracking-[0.2em] uppercase text-paper/60 mb-6">
            built for dartmouth
          </p>
          <blockquote className="text-2xl text-balance leading-snug text-paper">
            "What I cannot create, I do not understand."
          </blockquote>
          <p className="mt-6 text-xs font-head text-paper/60">
            — Richard Feynman
          </p>
        </motion.div>
      </aside>
    </main>
  );
}

function AuthBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <motion.div
        aria-hidden
        className="absolute -top-32 -right-32 w-96 h-96 bg-blue/25 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -left-32 w-96 h-96 bg-hl/15 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
