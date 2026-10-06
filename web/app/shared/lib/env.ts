// Env vars for the SPA. Supabase values are required at runtime (first auth
// call), but we don't throw at module load so the server can prerender the
// SPA fallback HTML during `npm run build` without needing them set.

const read = (name: string, value: string | undefined, fallback = ""): string => {
  if (!value || value.length === 0) {
    if (typeof window !== "undefined" && import.meta.env.PROD) {
      console.warn(`[env] Missing ${name}`);
    }
    return fallback;
  }
  return value;
};

export const env = {
  SUPABASE_URL: read(
    "VITE_SUPABASE_URL",
    import.meta.env.VITE_SUPABASE_URL,
    "http://localhost:0",
  ),
  SUPABASE_PUBLISHABLE_KEY: read(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "unset",
  ),
  API_URL:
    import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  SITE_URL:
    import.meta.env.VITE_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173"),
  ALLOWED_EMAIL_DOMAIN:
    import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN ?? "dartmouth.edu",
};
