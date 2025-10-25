// Vite exposes environment variables on import.meta.env.
// Use the typed import.meta (vite client types are referenced in vite-env.d.ts)
const env = (import.meta as any)?.env as Record<string, any> | undefined;
export const API_BASE = (env?.VITE_API_BASE as string) || 'http://127.0.0.1:4000';
