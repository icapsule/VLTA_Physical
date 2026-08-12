# 🎾 VLTA Physical Training System (v2.1)

A modern, highly decoupled web application designed for tennis coaches and athletes to digitally track, manage, and visualize physical fitness data.

> **Project Evolution**: This project has been fully upgraded to v2.1, strictly adhering to **Docs-as-Code** principles and an **Agile TDD (Test-Driven Development)** closed-loop ecosystem. It is now powered by a core **Tri-Table Relational Schema** and a versatile **Hybrid Training Log** system.

---

## 🏗️ Architecture Overview

VLTA 2.1 has been completely refactored into a pure, decoupled architecture leveraging **Clerk**, **Next.js Server Actions**, and **PostgreSQL**:

```text
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js App Router)            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Components  │  │    Hooks     │  │  Server Actions  │    │
│  │   (UI)      │──│(State Mgmt)  │──│ (Bridge/Verify)  │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
└────────┬─────────────────────┬──────────────────────────────┘
         │ Clerk               │ Zod + @clerk/nextjs/server
         ▼                     ▼
┌──────────────────┐ ┌────────────────────────────────────────┐
│  Identity & Auth   │ │          Backend Proxy Layer         │
│  Gateway (Clerk)   │ │       (Next.js Server Actions)       │
│  - Middleware      │ │  - Mandatory await auth() for userId │
│  - JWT Issuance    │ │  - Pure DB R/W (No RLS needed)       │
└──────────────────┘ └─────────────────┬──────────────────────┘
                                       │ supabase-js (Service Role)
                                       ▼
                     ┌────────────────────────────────────────┐
                     │          Persistent Data Engine        │
                     │             (Supabase DB)              │
                     │  - profiles (Clerk sync mapped)        │
                     │  - Core Tri-Table:                     │
                     │    * test_metrics (Dictionary)         │
                     │    * assessments (Sessions)            │
                     │    * assessment_results (Records)      │
                     └────────────────────────────────────────┘
```

### 🛠️ Core Tech Stack
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/) with React Server Components.
- **Authentication**: [Clerk](https://clerk.com/) (Middleware-driven, Role-based routing).
- **Styling & UI**: Tailwind CSS paired with [shadcn/ui](https://ui.shadcn.com/) components for rapid, accessible design.
- **Validation**: Zod schema validation strictly enforced on both Client Forms and Server Actions.
- **Database**: Supabase PostgreSQL (Running strictly as a persistent data layer, devoid of internal RLS triggers).
- **Data Visualization**: Recharts for dynamic charting and radar generation.

### 🔄 Key Architectural Shifts from v1.0
1. **Fully Decoupled Auth (Clerk)**: Completely removed native email/password bindings. A modernized Clerk JWT gateway now intercepts all authentication, routing, and session states.
2. **Action-Based Security (Zod + Server Actions)**: Eradicated all client-side `supabase.from()` calls and complex Row Level Security (RLS) policies. All database operations are now 100% physically isolated via server-side `auth().userId` validation and strict Zod payload parsing.
3. **Tri-Table Relational Schema**: Revolutionized the v1.0 single-table approach. We now use a high-performance relational structure: `test_metrics` (Standardized Dictionary) -> `assessments` (Session instances) -> `assessment_results` (Granular performance records).
4. **Hybrid Training Log**: Introduced the `record_type` architecture. This upgrades the rigid test-only system into a dual-track parallel logging flow, accommodating both daily Training Tasks (`training`) and strict Assessments (`test`), protected by data firewalls to ensure algorithm purity.
5. **Storage Ecosystem Migrated**: Native Supabase Storage buckets were ripped out entirely. Avatar and media lifecycles are now exclusively offloaded to Clerk's resilient `<UserButton />` infrastructure.

---

## 🚀 Core Features & Workflows

### 🏃 For Athletes
- **Digital Profiling**: Athletes can maintain their foundational bios (height, weight, etc.) through Server Action-persisted mutations.
- **Fitness Tracking & Radar**: Visualize historical progressions of physical tests (Speed, Power, Flexibility, Endurance) via dynamic Recharts and multi-dimensional radar charts.
- **Training Agendas**: Access daily micro-training cards with calendar-based tracking to self-monitor training consistency.

### 👨‍🏫 For Coaches
- **Matrix Group Session Entry**: Completely overturns traditional linear data entry. We introduced an Excel-grade **DataGrid Matrix**. Coaches can seamlessly select "Multiple Athletes × Multiple Tasks", utilize rapid keyboard navigation for scoring, and trigger a "Mark All Passed" magic button. A powerful Server Action handles millisecond-level concurrent assembly and bulk database insertion.
- **Hybrid Log Management**: Manage the dual-track system (Tests vs. Training) seamlessly. Log daily agility ladder drills alongside strict 100m sprint assessments without polluting the core fitness radar algorithms.
- **Plan Construction**: Utilize a JSONB-backed editor to architect detailed training blueprints and distribute them instantly to all assigned athletes.
- **Holistic Monitoring**: Gain god-mode visibility through the `Test & Training Metrics` Data Dictionary panel and a comprehensive, unpolluted athlete radar scoring dashboard.

---

## 🗺️ Roadmap & Future Refactoring
- [ ] **Extreme DRY Data Fetching Refactor**: Abstract the redundant data fetching and transformation logic (e.g., calculating latest PB metrics and generating radar chart states) currently present in both `/coach/athletes/[athleteId]/page.tsx` and `/(athlete)/profile/page.tsx` into a singular, highly decoupled Server Service (`e.g., getAthleteDashboardData(athleteId)`). Ensure absolute single source of truth for both Data and Page Request layers.

---

## 🏛️ The Tri-Doc Ecosystem (Project Specifications)

For in-depth development, architecture decisions, or commercial alignment, every granular detail of this project has been horizontally extracted into our centralized documentation hubs:

1. 👉 **[PRD.md](./PRD.md) (The Business Brain)**: Outlines the product vision, user role definitions (Coach vs. Athlete), business priorities (MoSCoW), MVP delivery milestones, and future roadmaps (e.g., Edge Function missed-training notifications).
2. 👉 **[TennisPysical_PROJECT_SPEC.md](./TennisPysical_PROJECT_SPEC.md) (The Technical Skeleton)**: Contains comprehensive database table definitions, RLS-free bypass flows, algorithmic dimension weighting, and the **strictly enforced Vibe Coding conventions and TDD scripting guidelines**.
3. 👉 **[AgentSkills Pipeline](../AgentSkills/) (AI Full-Stack Core)**: The proprietary `.antigravity` AI agent integration environment, dictating advanced maneuver protocols like automated TDD and traffic-splitting refactors.

---

## 💻 Local Development Setup

1. Clone the repository to your local machine.
2. Ensure you create a `.env.local` file in the root directory and populate it with the required keys:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
   CLERK_SECRET_KEY=...
   SUPABASE_DB_PASSWORD=...
   ```
3. Execute a clean, lockfile-based installation:
   ```bash
   pnpm install
   ```
4. Ignite the full-stack proxy development server:
   ```bash
   pnpm dev
   ```
5. Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to enter the modernized Clerk authentication gateway.

---

## 🛡️ Database Maintenance & Backups (运维与数据备份)

To ensure the Supabase PostgreSQL database remains **7×24 online without free-tier inactivity pausing** and is **fully protected with automated 7-day rolling backups**, the project includes a dedicated automation pipeline:

### ⚡ 1. 100% Bulletproof Keep-Alive
- **Mechanism**: Every 2 days, a GitHub Actions workflow (`.github/workflows/supabase-maintenance.yml`) executes a real SQL query (`/rest/v1/profiles?select=count`) against the database.
- **Benefit**: Fully resets Supabase's 7-day inactivity pause countdown, keeping the cloud database permanently active.

### 📦 2. Automated 7-Day Rolling Backups
- **Cloud Backup**: Every day at 02:00 AM UTC, the workflow exports a full JSON/SQL snapshot of the database, compresses it (`.gz`), and uploads it to **GitHub Artifacts**.
- **Retention**: Artifacts are set with `retention-days: 7` to automatically cycle and retain the last 7 days of rolling backups.

### 💻 3. Local One-Click Manual Backup
You can trigger a full local backup snapshot at any time before major deployments or schema migrations:
```bash
npm run db:backup
```
The output `.sql` file will be securely stored in the local `/backups/` directory (git-ignored).

---

> *"Before modifying a single line of code in this project, ensure that the requirement is comprehensively documented and ratified within the corresponding PRD or SPEC document."*
