# Archived setup notes (PostgreSQL / Bolt) — not current

This repository’s **live backend uses MongoDB + Mongoose** (`server/`, `MONGODB_URI`).  
The text below was preserved from an older README for reference only.

---

## Quick setup (historical — PostgreSQL)

1. Root project: install frontend deps (run in project root where package.json exists).

2. Server (historical):

   - `cd server`
   - `npm install`
   - Create a `.env` file in `server/` (you can copy `.env.example`) and fill required values. Example variables:

     ```
     DATABASE_URL=postgresql://user:password@localhost:5432/utopiahire
     JWT_SECRET=your_jwt_secret
     OPENAI_API_KEY=sk-...
     KAGGLE_USERNAME=your_kaggle_username
     KAGGLE_KEY=your_kaggle_key
     ```

     (Optional for Google OAuth)

     ```
     GOOGLE_CLIENT_ID=...
     GOOGLE_CLIENT_SECRET=...
     GOOGLE_CALLBACK=http://localhost:4000/auth/google/callback
     ```

   - Run migrations: `npm run migrate`
   - Run dev server: `npm run dev`

3. Edge functions (Deno): set environment variables and deploy to your edge platform or run with `deno run --allow-net --allow-env edge/openai_processor.ts`

**Notes (historical):**

- The server was described as using PostgreSQL (Bolt compatible). Migrations were in `server/migrations`.
- The OpenAI edge function calls the OpenAI chat completion endpoint and attempts to parse JSON suggestions.
- The Kaggle edge function demonstrates fetching dataset metadata using basic auth; Kaggle’s recommended usage is via the official Python client and may require adaptation.
