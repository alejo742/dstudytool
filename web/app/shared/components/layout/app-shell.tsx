import { Link, NavLink, useLocation } from "react-router";
import { motion } from "motion/react";
import { LogOut, Settings, BookOpen } from "lucide-react";
import { getSupabase } from "~/shared/lib/supabase";
import { useAuth } from "~/features/auth/hooks/auth-provider";
import { cn } from "~/shared/lib/cn";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const location = useLocation();

  const logout = async () => {
    await getSupabase().auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-ink bg-paper2/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/plans"
            className="flex items-center gap-2 font-head font-bold text-lg tracking-tight text-ink no-underline"
          >
            <Mark />
            <span>Study tool</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavItem to="/plans" icon={<BookOpen size={14} />} label="Plans" />
            <NavItem to="/settings" icon={<Settings size={14} />} label="Settings" />
            <div className="w-px h-5 bg-rule mx-2" />
            <div className="flex items-center gap-2 pr-2">
              <div className="w-7 h-7 bg-ink text-paper text-xs flex items-center justify-center font-head font-semibold">
                {initials(profile?.full_name || profile?.email || "?")}
              </div>
              <span className="text-xs text-ink3 hidden sm:block max-w-[14ch] truncate font-mono">
                {profile?.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="w-8 h-8 inline-flex items-center justify-center border-[1.5px] border-transparent text-ink3 hover:text-ink hover:bg-hl-wash hover:border-ink transition"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </nav>
        </div>
      </header>

      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        {children}
      </motion.main>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "px-3 h-8 inline-flex items-center gap-1.5 font-head font-semibold text-sm no-underline border-l-[3px] transition",
          isActive
            ? "text-ink bg-hl-wash border-red"
            : "text-ink2 border-transparent hover:text-ink hover:bg-hl-wash/60",
        )
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  );
}

function Mark() {
  return (
    <span className="relative inline-block w-6 h-6 bg-ink text-paper overflow-hidden">
      <motion.span
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex items-center justify-center font-head font-bold text-sm leading-none"
      >
        S
      </motion.span>
    </span>
  );
}

function initials(name: string) {
  const parts = name.split(/[\s@]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}
