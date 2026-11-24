# ALL1 — Data, Database & Google Login

## Tech
Supabase free tier: Postgres + Realtime + Auth (Google) + Storage. Frontend uses the public anon key;
protection comes from Row Level Security and database functions.

.env.example:
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEMO_PIN_ENABLED=true

## What we store
- settings (salon name ALL1, hours 10:00–21:00, online tokens on/off, daily token counter)
- services (EN/GU name, minutes, price, active)
- barbers (Mahesh, Suresh, Ashlesh: photo, email, working today, on break)
- staff (Google email + role)
- queue_entries (token, name, phone, services, totals, preferred/assigned barber, status, source, timestamps, late-extension flag)

## Access (RLS)
- Anyone: read services, barbers, settings, and a public queue view WITHOUT phone numbers; create/read/release their own token only through functions.
- Receptionist: full queue control.
- Barber: Start/Finish for own customers, own break switch.
- Owner: everything, including services, barbers, staff and settings.
- Phone numbers never appear on the TV or in public data.

## Database functions (the only place for rules)
take_token, add_walkin, call_next, start_service, finish_service, mark_no_show, extend_late, release_token, estimate_wait.

## Google login setup
1. Google Cloud Console → new project → OAuth consent screen (External; add yourself as test user).
2. Credentials → OAuth client ID (Web) → redirect URI = callback URL from Supabase (Auth → Providers → Google).
3. Paste Client ID/Secret into Supabase and enable Google.
4. Supabase → Auth → URL Configuration: add http://localhost:5173 and your Vercel URL.
5. Insert your Gmail into `staff` with role `owner`.

## Realtime
Subscribe to queue_entries, barbers, settings; fall back to 5-second polling if the connection drops.
