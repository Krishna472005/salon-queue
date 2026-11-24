# prompts.md — log of every prompt I use (in order, including ones that failed)

## Step 1 — Understand & set up
Read AGENTS.md, all of docs/ and supabase/schema.sql. Summarise ALL1 in 8 bullets and list questions. Then set up React + Vite + Tailwind with the Ocean & Coral tokens from docs/04-design-system.md, fonts, empty pages for all 8 routes, and the EN/GU toggle. Stop when it runs.

## Step 2 — Database + Google login
Add the Supabase client and .env.example. Give me the final SQL (tables, RLS, public view without phone numbers, functions). Build /login with Google, staff-email check, role route guards and the optional demo PIN. Touch no other screens.

## Step 3 — Landing + Get Token
Build S1 and S2 from docs/02-screens.md with live Supabase data. Validate phone, max 4 services, paused online tokens. The sticky summary must update as I tick services. Call take_token on Confirm.

## Step 4 — My Token
Build S3: ticket card, position, wait ring, "Head over now" banner, full-screen "You're up!", I'm running late, break note, no-show state, release with confirmation. Use realtime.

## Step 5 — Reception Board
Build S4 for a 10-inch landscape tablet. Online tokens appear automatically. Call next must follow the barber-preference rule. Add walk-in, No-show, Remove, amber after 75 min. Then give me 3 hand-test scenarios proving preferences work.

## Step 6 — Barber Screen + TV
Build S5 and S6. Start/Finish and break must update reception, TV and the customer phone within 5 seconds.

## Step 7 — Owner Panel
Build S7: services editing, who works today, staff emails/roles, online tokens switch, stats cards and busiest-hour chart. A switched-off service must vanish from Get Token.

## Step 8 — Edge cases & polish
Finish no-show re-entry, running-late, cancel, break and 20-minute cut-off rules. Add empty states. Check every screen in Gujarati for overflow. Ensure 44px tap targets.

## Step 9 — Verify
Run the full test checklist in docs/03-flows-rules.md; report pass/fail and how you checked. Fix failures without changing the design.

## Step 10 — Deploy
Prepare for Vercel (build command, env vars, no localhost URLs, SPA rewrite) and give exact deploy steps. Put **Live demo:** <url> right under the README title, then the demo PINs.

## Bug template
On <screen>, when I <action>, <what happened>. Expected: <what should happen>. Explain the cause first, then fix.

---
(Add your own prompts below with a note on whether they worked.)
