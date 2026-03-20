# 🎾 VLTA Physical Training System (v2.0)

A modern, highly decoupled web application designed for tennis coaches and athletes to digitally track, manage, and visualize physical fitness data.

## 🏗️ Architecture Overview (VLTA 2.0)

This project has recently undergone a major architectural shift to the **Decoupled Architecture (VLTA 2.0)** to maximize scalability, security, and developer experience.

### Tech Stack
* **Frontend/Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
* **Authentication & Identity**: [Clerk](https://clerk.com/)
* **Database**: [Supabase (PostgreSQL)](https://supabase.com/)
* **Security & Validation**: Zod + Next.js Server Actions
* **Styling & UI**: Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)
* **Data Visualization**: Recharts

### Key Architectural Shifts from v1.0
1. **Fully Decoupled Auth (Clerk)**: The system no longer relies on Supabase Auth or its complex cookie SSR helpers. All routing, session states, and gateway protections are seamlessly managed by Clerk Middleware.
2. **PostgreSQL as a Pure Database**: We disconnected the `profiles` table from Supabase's internal `auth.users` UUID constraint. Primary keys are now dynamically mapped `text` identifiers designed to directly interface with Clerk's `user_xxx` IDs.
3. **Eradication of RLS & Storage Buckets**: Supabase Row-Level Security (RLS) has been completely removed. We eliminated error-prone, database-layer policies in favor of application-layer safeguards. Object storage buckets have also been removed—avatar lifecycle management is now exclusively handled by Clerk's underlying `<UserButton/>` components.
4. **Action-Based Security (Zod + Server Actions)**: Clients are strictly forbidden from performing direct `supabase.from().update()` database writes. Instead, all mutations (like modifying athlete profiles or logging bulk test entries) pass through rigorous Zod schema validations on the client, before hitting a Next.js Server Action where absolute authorization (`auth().userId`) is asserted against the DB context.

## 🚀 Core Features & Workflows

### For Athletes
* **Personal Fitness Dashboard**: Visualize historical progression of fitness tests (Speed, Power, Flexibility, Endurance) via animated SVG components and interactive Recharts block graphs.
* **Profile Management**: Update critical physical measurements (Height, Weight) directly from the application endpoint, which immediately mirrors changes on the unified Coach table.

### For Coaches
* **Global Overview**: Manage an entire roster of athletes, sorted dynamically by their aggregated physical fitness score.
* **Bulk Test Injection**: Use the streamlined `BulkTestEntry` form to rapidly document an athlete's newly achieved fitness metrics (spider run, broad jumps, beep tests, etc.) post-testing session.

---

## 🗺️ Roadmap & Upcoming Features

The VLTA Training application is actively evolving. Our upcoming priorities are centered around granular metric controls and team administration:

- [ ] **Athlete-Managed Personal Bests (PB)**: Athletes will gain the capability to self-record, edit, and curate their own physical fitness "Personal Best" (PB) records—including the exact date (`test_date`) those milestones were achieved, shifting some administrative burden off coaches while boosting motivation.
- [ ] **Parent Read-Only Portals**: An exclusive view allowing parents to easily monitor a child's training schedule and fitness growth progression without mutation permissions.
- [ ] **Advanced Analytical Reports**: Providing coaches with macro-level team tracking and rank sorting, allowing for competitive intra-team analysis.
- [ ] **Automated Reminders**: Integration of Edge Functions to parse planned workout routines and send webhook-triggered email notifications for missed sessions.

## 💻 Getting Started (Local Development)

1. Rename `.env.example` to `.env.local` and fill in the required Clerk and Supabase variables.
2. Install dependencies: `pnpm install`
3. Generate Supabase types (if needed): `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts`
4. Spin up the dev server: `pnpm dev`
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
