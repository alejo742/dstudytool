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
    href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Caveat:wght@500;600&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#EDF2E6" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-full antialiased bg-paper text-ink" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" theme="light" closeButton />
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

export function HydrateFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-grid">
      <div className="flex flex-col items-center gap-4">
        <div className="w-7 h-7 border-2 border-rule border-t-ink animate-spin" />
        <p className="font-head font-semibold text-sm tracking-[0.2em] uppercase text-ink3">
          Study tool
        </p>
      </div>
    </main>
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
    <main className="min-h-screen flex items-center justify-center px-6 bg-grid">
      <div className="max-w-md text-center bg-paper2 border-[1.5px] border-ink p-8 shadow-brut">
        <p className="font-head text-sm tracking-[0.2em] uppercase text-ink3 mb-3">
          Study tool
        </p>
        <h1 className="font-head font-bold text-5xl leading-none mb-4">{message}</h1>
        <p className="text-ink2 mb-8">{details}</p>
        <a
          href="/"
          className="btn btn-pri"
        >
          Return home
        </a>
        {stack && (
          <pre className="mt-10 text-left w-full p-4 overflow-x-auto bg-code text-code-fg font-mono text-xs">
            <code>{stack}</code>
          </pre>
        )}
      </div>
    </main>
  );
}
