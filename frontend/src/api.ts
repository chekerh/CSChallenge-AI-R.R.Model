/** Backend base URL (no trailing slash). Prefer VITE_API_URL; VITE_API_BASE is legacy alias. */
export const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ||
  'http://127.0.0.1:4000';
