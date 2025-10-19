# AEO (AI-Search Visibility) Tracker

This project is a multi-tenant Next.js application designed to track a brand's visibility in AI search engine answers, built for the "Assignment B" requirements.

---

## 🚀 Live Demo & Test Login

**Live URL:** [https://aeo-tracker-2j9ec0gev-raphels-projects.vercel.app/login](https://aeo-tracker.vercel.app)

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

Here is the complete SQL schema used for the Supabase database, including tables, RLS policies, and helper functions.

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  brand_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keywords Table
CREATE TABLE keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checks Table (Core AEO Tracking Data)
CREATE TABLE checks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  keyword_id UUID NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  engine TEXT NOT NULL,                    -- AI engine name (Gemini, Perplexity, ChatGPT)
  presence BOOLEAN NOT NULL,               -- Is brand present in AI answer?
  position INTEGER,                        -- Ranking position (nullable if not present)
  answer_snippet TEXT,                     -- Captured AI response excerpt
  citations_count INTEGER DEFAULT 0,       -- Number of citations in answer
  observed_urls TEXT[],                    -- Array of URLs cited by AI
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Projects RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Keywords RLS
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view keywords from their projects"
  ON keywords FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert keywords to their projects"
  ON keywords FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own keywords"
  ON keywords FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own keywords"
  ON keywords FOR DELETE
  USING (auth.uid() = user_id);

-- Checks RLS
ALTER TABLE checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checks"
  ON checks FOR SELECT
  USING (auth.uid() = user_id);

-- Note: Checks INSERT is handled via service_role key in API routes
-- to bypass RLS for automated check insertions

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

-- Function: Get Project KPIs (last 24 hours)
CREATE OR REPLACE FUNCTION get_project_kpis(p_project_id UUID)
RETURNS TABLE (
  visibility_score NUMERIC,
  total_keywords BIGINT,
  engines_covered BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(CASE WHEN presence THEN 100 ELSE 0 END), 1) as visibility_score,
    COUNT(DISTINCT keyword_id) as total_keywords,
    COUNT(DISTINCT engine) as engines_covered
  FROM checks
  WHERE project_id = p_project_id
    AND timestamp > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Project Visibility Trend (last 30 days)
CREATE OR REPLACE FUNCTION get_project_trend(p_project_id UUID)
RETURNS TABLE (
  day DATE,
  visibility NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(timestamp) as day,
    ROUND(AVG(CASE WHEN presence THEN 100 ELSE 0 END), 1) as visibility
  FROM checks
  WHERE project_id = p_project_id
    AND timestamp > NOW() - INTERVAL '30 days'
  GROUP BY DATE(timestamp)
  ORDER BY day ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_checks_project_timestamp ON checks(project_id, timestamp DESC);
CREATE INDEX idx_checks_keyword_engine ON checks(keyword_id, engine, timestamp DESC);
CREATE INDEX idx_keywords_project ON keywords(project_id);
CREATE INDEX idx_projects_user ON projects(user_id);
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