# AGENTS.md — ALL1 Salon Queue

A live waiting-line app for ALL1 salon. Customers take a digital token on their phone, watch their
turn approach, and get called. Reception and the three barbers run the line; a TV shows the status.

## Read these first
1. docs/01-brief.md          what we build, what we skip
2. docs/02-screens.md        every screen and button
3. docs/03-flows-rules.md    queue logic + test checklist
4. docs/04-design-system.md  colours, fonts, logo, wording
5. docs/05-data-and-auth.md  database, Google login, security
6. supabase/schema.sql       starting database

## Stack
- React + Vite + Tailwind CSS, react-router, framer-motion, lucide-react
- Supabase: Postgres + Realtime + Google Auth + Storage (no custom backend)
- Run: `npm run dev`. Secrets only in `.env.local`; keep `.env.example` updated.
- Deploy: Vercel. Add `vercel.json` SPA rewrite so refreshing any route works.
- README.md must start with the title, then `**Live demo:** <url>` on the next line.

## Working rules
- One screen / one feature per task; never edit unrelated screens.
- For big steps: post a plan + file list first and wait for my OK.
- Colours and fonts only from the tokens in docs/04-design-system.md (Tailwind theme). No loose hex codes in components.
- No hard-coded text: all labels come from the EN/GU language file.
- All queue rules live in ONE place (Postgres functions); the UI only calls them.
- Never build anything from the "Not building" list in docs/01-brief.md.
- Mobile-first, tap targets >= 44px, TV text readable from 5 m.
- Use the ALL1 data: barbers Mahesh, Suresh, Ashlesh; the 5 services in docs/01-brief.md; prices in ₹.
- After each task: list changed files + how to test. For bugs: explain the cause, then fix.
