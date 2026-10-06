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
            className="text-xs tracking-[0.2em] uppercase text-ink-400 hover:text-ink-700 transition"
          >
            ← Back
          </Link>
          <h1 className="font-serif text-4xl mt-6 text-balance">
            Sign in to continue
          </h1>
          <p className="text-ink-500 mt-2 text-pretty">
            Study tool is restricted to Dartmouth email addresses
            <span className="font-mono text-ink-700"> (@{env.ALLOWED_EMAIL_DOMAIN})</span>.
          </p>

          <div className="mt-10">
            <GoogleButton redirectAfter={next} />
          </div>

          {status === "domain-rejected" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-md border border-red-100 bg-red-50 text-sm text-red-700"
            >
              <strong className="block font-medium text-red-800">
                {rejectedEmail ?? "That account"} isn't a Dartmouth address.
              </strong>
              Sign in with your <code>@{env.ALLOWED_EMAIL_DOMAIN}</code> Google
              account to continue.
            </motion.div>
          )}

          <p className="text-xs text-ink-400 mt-10 text-pretty">
            We only ever request your name, email, and avatar from Google.
          </p>
        </motion.div>
      </section>

      <aside className="hidden lg:flex items-center justify-center bg-ink-900 text-ink-50 relative overflow-hidden">
        <AuthBackdrop />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative max-w-sm px-12 text-center"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-ink-400 mb-6">
            built for dartmouth
          </p>
          <blockquote className="font-serif text-2xl text-balance leading-snug">
            "You can keep requesting new practice material indefinitely, and it
            keeps producing things that are actually tied to the course."
          </blockquote>
          <p className="mt-6 text-xs text-ink-400">
            — from the proof-of-concept spec
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
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <motion.div
        aria-hidden
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
