import { Link } from "react-router";
import { motion } from "motion/react";
import { Suspense, lazy } from "react";
import { ArrowRight, FileText, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { useAuth } from "~/features/auth/hooks/auth-provider";

const OrbitalHero = lazy(() =>
  import("~/shared/components/three/orbital-hero").then((m) => ({
    default: m.OrbitalHero,
  })),
);

export function meta() {
  return [
    { title: "Study tool — practice built from your course" },
    {
      name: "description",
      content:
        "Upload your course materials in any format and study with grounded, non-repeating practice material powered by Dartmouth AI.",
    },
  ];
}

export default function LandingRoute() {
  const { status } = useAuth();
  const ctaHref = status === "signed-in" ? "/plans" : "/login";

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-lg tracking-tight">
          Study tool
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <a
            href="#how-it-works"
            className="px-3 py-1.5 text-ink-500 hover:text-ink-900 transition"
          >
            How it works
          </a>
          <Link
            to={ctaHref}
            className="px-3 py-1.5 bg-ink-900 text-ink-50 rounded-md hover:bg-ink-800 transition"
          >
            {status === "signed-in" ? "Open" : "Sign in"}
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xs tracking-[0.22em] uppercase text-ink-400 mb-6"
          >
            Dartmouth-only · bring your own key
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-serif text-5xl md:text-6xl text-balance leading-[1.05]"
          >
            Practice material{" "}
            <span className="italic text-ink-500">made from</span> your
            course.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-6 text-lg text-ink-500 max-w-lg text-pretty"
          >
            Upload the slides, syllabus, and problem sets you already have.
            Study from an unlimited stream of practice problems grounded in that
            exact material — not generic recall.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-10 flex items-center gap-3"
          >
            <Link
              to={ctaHref}
              className="inline-flex items-center gap-2 h-12 pl-6 pr-5 rounded-lg bg-ink-900 text-ink-50 text-base font-medium hover:bg-ink-800 transition active:scale-[0.98]"
            >
              {status === "signed-in" ? "Open your plans" : "Get started"}
              <ArrowRight size={16} />
            </Link>
            <a
              href="#how-it-works"
              className="text-sm text-ink-500 hover:text-ink-900 transition inline-flex items-center gap-1 border-b border-transparent hover:border-ink-300 pb-0.5"
            >
              Learn more
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-wrap gap-4 text-xs text-ink-500"
          >
            <Flag label="PDF, image, DOCX, slides" />
            <Flag label="Non-repeating stream" />
            <Flag label="Your Dartmouth Chat key" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[460px] lg:h-[520px]"
        >
          <Suspense fallback={<div className="w-full h-full" />}>
            <OrbitalHero />
          </Suspense>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-50 to-transparent" />
        </motion.div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-ink-200/70 bg-white/50"
      >
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-xs tracking-[0.22em] uppercase text-ink-400 mb-4">
            The loop
          </p>
          <h2 className="font-serif text-3xl md:text-4xl max-w-2xl text-balance">
            Everything you have for the course, in one plan.
          </h2>

          <div className="mt-14 grid md:grid-cols-3 gap-8">
            <Step
              step="01"
              title="Create a plan"
              body="One per course. The container everything else attaches to."
              icon={<Sparkles size={18} />}
            />
            <Step
              step="02"
              title="Drop in anything"
              body="PDFs, image-heavy slide decks, DOCX, text. We extract what's inside — even from scanned slides."
              icon={<FileText size={18} />}
            />
            <Step
              step="03"
              title="Study, indefinitely"
              body="Request as many practice problems as you want. Each one is grounded in what you uploaded, and tracked so it doesn't repeat."
              icon={<InfinityIcon size={18} />}
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-200/70 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-ink-400">
          <p>Built for Dartmouth students. Uses Dartmouth-hosted AI only.</p>
          <p>© {new Date().getFullYear()} · Study tool</p>
        </div>
      </footer>
    </main>
  );
}

function Flag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-dartmouth rounded-full" />
      {label}
    </span>
  );
}

function Step({
  step,
  title,
  body,
  icon,
}: {
  step: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4 }}
      className="group"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-xs text-ink-400">{step}</span>
        <span className="h-px flex-1 bg-ink-200" />
        <span className="w-8 h-8 rounded-md bg-ink-900 text-ink-50 flex items-center justify-center group-hover:bg-accent-600 transition">
          {icon}
        </span>
      </div>
      <h3 className="font-serif text-xl text-ink-900 mb-2">{title}</h3>
      <p className="text-ink-500 text-sm text-pretty">{body}</p>
    </motion.div>
  );
}
