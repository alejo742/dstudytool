import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { Toaster } from "sonner";

import type { Route } from "./+types/root";
import "./app.css";
import { AuthProvider } from "~/features/auth/hooks/auth-provider";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=JetBrains+Mono:wght@400;500&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f7f7f6" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-full antialiased">
        {children}
        <Toaster position="bottom-right" theme="light" richColors closeButton />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went off-course";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "This page doesn't exist (yet)."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center animate-fade-up">
        <p className="text-xs tracking-[0.2em] uppercase text-ink-400 mb-4">
          Study tool
        </p>
        <h1 className="font-serif text-5xl mb-4">{message}</h1>
        <p className="text-ink-500 text-pretty mb-8">{details}</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium border-b border-ink-900 pb-0.5 hover:text-ink-600 hover:border-ink-600 transition"
        >
          Return home
        </a>
        {stack && (
          <pre className="mt-10 text-left w-full p-4 overflow-x-auto bg-ink-900 text-ink-50 rounded text-xs">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
