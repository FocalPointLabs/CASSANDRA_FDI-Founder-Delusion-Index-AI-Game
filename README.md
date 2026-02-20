# CASSANDRA — Founder Delusion Index

A satirical startup idea scoring game built with Next.js, Supabase, and the Cerebras LLM. Submit your startup idea, receive your Delusion Index scores, face the verdict, try to make the leaderboard!
---

## What It Does

CASSANDRA The Oracle bot takes your startup pitch and ruthlessly evaluates it across seven metrics, then delivers a goblin-brained verdict and assigns you a founder rank. Results are saved to a weekly leaderboard ranked by composite score.

**Scoring Metrics**
- **AI Hype Beast** — How saturated with AI/ML terminology is your idea?
- **Buzzword Density** — Raw startup jargon and hype language density
- **Cringe Founder Energy** — Motivational poster energy and founder-bro language
- **Market Viability** — Heuristic viability based on specificity and length
- **Pivot-to-AI Probability** — How likely are you to slap AI on this in 18 months?
- **YC Bait Score** — LLM-evaluated likelihood of a YC application
- **Delusion Index** — Overall delusional confidence score

**Founder Ranks**
- `Chad` — Actually has something here
- `Beta` — Trying hard, missing the point
- `Gamma` — Deeply confused but confident
- `Founder Extraordinaire` — So unhinged it loops back to visionary

---

## Tech Stack

- **Framework** — Next.js (Pages Router)
- **Database & Auth** — Supabase (Postgres + Auth)
- **LLM** — Cerebras (`gpt-oss-120b`) for YC bait score, delusion index, founder rank, and goblin verdict
- **Styling** — Tailwind CSS + custom oracle.css design system
- **Fonts** — Teko + Courier Prime via `next/font/google`
- **Language** — TypeScript

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- A Cerebras API key

### Install

```bash
git clone https://github.com/yourusername/the-delusion-index.git
cd the-delusion-index
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CEREBRAS_API_KEY=your_cerebras_api_key
```

### Supabase Schema

You'll need three tables:

```sql
-- Profiles
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  name text,
  followers text,
  motivation text
);

-- Ideas
create table ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  idea_text text,
  created_at timestamptz default now()
);

-- Scores
create table scores (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references ideas not null,
  user_id uuid references auth.users not null,
  ai_hype_beast int,
  buzzword_density int,
  cringe_founder_energy int,
  market_viability int,
  pivot_to_ai_probability int,
  yc_bait_score int,
  delusion_index int,
  composite_score int,
  founder_rank text,
  goblin_verdict text,
  created_at timestamptz default now()
);
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
├── components/
│   └── OnboardingModal.tsx   # Multi-step onboarding flow
├── lib/
│   ├── fonts.ts              # next/font/google setup (Teko + Courier Prime)
│   ├── supabaseClient.ts     # Supabase client
│   └── useAuth.ts            # Auth hook
├── pages/
│   ├── api/
│   │   └── score.ts          # Scoring API — heuristics + Cerebras LLM
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx             # Homepage
│   ├── idea.tsx              # Idea submission + results
│   ├── leaderboard.tsx       # Weekly leaderboard
│   └── login.tsx             # Auth page
└── styles/
    ├── globals.css
    └── oracle.css            # Master design system stylesheet
```

---

## Notes

- Scores are a mix of keyword heuristics (computed server-side) and LLM evaluation (Cerebras.)
- The leaderboard resets weekly, ranked by composite score.
- Onboarding profile data (name, follower count, motivation) is stored in Supabase and cached in localStorage.
 *CASSANDRA/The Oracle is not a real investor. All game results are satire.*

---

*Built with Next.js · Supabase · Cerebras LLM*