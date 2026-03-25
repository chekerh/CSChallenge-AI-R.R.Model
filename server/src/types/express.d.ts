/// <reference types="express" />

declare global {
  namespace Express {
    /** JWT-authenticated user (set by `requireAuth` middleware). */
    interface User {
      id: string;
      email?: string;
      role?: string;
    }
  }
}

export {};
