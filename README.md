# AEO (AI-Search Visibility) Tracker

This project is a multi-tenant Next.js application designed to track a brand's visibility in AI search engine answers, built for the "Assignment B" requirements.

---

## 🚀 Live Demo & Test Login

**Live URL:** [https://aeo-tracker-2j9ec0gev-raphels-projects.vercel.app/login](https://your-project-name.vercel.app)

You can use the pre-seeded test account to explore the dashboard immediately:

* **Email:** `test@example.com`
* **Password:** `password123`

---

## ✨ Core Features

* **Authentication:** Multi-tenant auth using Supabase Auth (RLS).
* **Project Management:** Users can create projects and add keywords to track.
* **AEO Tracking:** Simulates daily checks for keyword visibility across multiple AI engines (Gemini, Perplexity, ChatGPT).
* **Dynamic Dashboards:** Built with Tremor, showing visibility scores, 30-day trends, and keyword breakdowns.
* **Recommendations:** Simple heuristics to suggest improvements (e.g., "Missing on engine X").

---

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router)
* **Database & Auth:** Supabase (PostgreSQL, Auth, RLS)
* **UI:** Tailwind CSS
* **Dashboards:** Tremor
* **Deployment:** Vercel

---

## Database Schema

Here is the SQL schema used for the Supabase database.

```sql
-- Paste your SQL CREATE TABLE statements from Phase 1 here
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  ...
);

CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  ...
);

CREATE TABLE checks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  ...
);
```

---

## 🌀 Simulation & Seed Design

This project uses a simulation script (`/scripts/seed.ts`) to generate realistic, time-series data.

* **Data:** It generates **14 days** of check data for the test user.
* **Engines:** It simulates checks for `Gemini`, `Perplexity`, and `ChatGPT`.
* **Realistic Trends:** The simulation is not purely random. Specific keywords (e.g., "next.js hosting") are programmed to trend *up* in visibility, while others (e.g., "jamstack hosting") trend *down*. This makes the dashboard charts look realistic and dynamic.
* **Presence & Citations:** The script simulates a `presence` (boolean) and whether the target domain (`vercel.com` for the seed) was included in the `observed_urls`.

---

## Running Locally

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Create a `.env.local` file and add your Supabase variables.
4.  Run the seed script to populate your database: `npm run db:seed`
5.  Start the development server: `npm run dev`