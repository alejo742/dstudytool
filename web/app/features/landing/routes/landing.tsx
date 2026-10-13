import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Suspense, lazy, useEffect } from "react";
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
  const navigate = useNavigate();
  const ctaHref = status === "signed-in" ? "/plans" : "/login";

  useEffect(() => {
    if (status === "signed-in") navigate("/plans", { replace: true });
  }, [status, navigate]);

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-ink">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-head font-bold text-lg tracking-tight text-ink no-underline">
            Study tool
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <a
              href="#how-it-works"
              className="font-head font-semibold text-ink2 hover:text-ink px-3 py-1.5 no-underline"
            >
              How it works
            </a>
            <Link to={ctaHref} className="btn btn-pri btn-sm no-underline">
              {status === "signed-in" ? "Open" : "Sign in"}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-grid border-b border-ink">
        <div className="max-w-5xl mx-auto px-6 py-16 md:py-20 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="eyebrow mb-5"
            >
              Dartmouth only · bring your own key
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-head font-bold text-5xl md:text-6xl lg:text-7xl text-balance leading-[0.95] tracking-tight"
            >
              Practice material made from your course.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-6 text-lg text-ink2 max-w-xl text-pretty"
            >
              Upload the slides, syllabus, and problem sets you already have.
              Study from an unlimited stream of practice problems grounded in
              that exact material.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mt-8 flex items-center gap-3 flex-wrap"
            >
              <Link to={ctaHref} className="btn btn-pri btn-lg no-underline">
                {status === "signed-in" ? "Open your plans" : "Get started"}
                <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="btn btn-lg no-underline">
                Learn more
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink2 font-head font-semibold"
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
            className="relative h-[420px] lg:h-[480px] border-[1.5px] border-ink bg-paper2 shadow-brut overflow-hidden"
          >
            <Suspense fallback={<div className="w-full h-full" />}>
              <OrbitalHero />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-ink bg-paper">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <p className="eyebrow mb-3">The loop</p>
          <h2 className="font-head font-bold text-4xl md:text-5xl max-w-2xl text-balance leading-[1]">
            Everything you have for the course, in one plan.
          </h2>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Step
              step="01"
              title="Create a plan"
              body="One per course. The container everything else attaches to."
              icon={<Sparkles size={18} />}
            />
            <Step
              step="02"
              title="Drop in anything"
              body="PDFs, image-heavy slide decks, DOCX, text. We extract what's inside, even from scanned slides."
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

      <footer className="py-8 bg-paper">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-ink3 font-head font-semibold">
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
      <span className="w-2 h-2 bg-ink" />
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
      className="border-[1.5px] border-ink bg-paper2 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="font-mono text-xs text-ink3">{step}</span>
        <span className="h-px flex-1 bg-ink" />
        <span className="w-9 h-9 bg-ink text-paper flex items-center justify-center">
          {icon}
        </span>
      </div>
      <h3 className="font-head font-bold text-2xl text-ink leading-tight mb-2">
        {title}
      </h3>
      <p className="text-ink2 text-pretty">{body}</p>
    </motion.div>
  );
}
