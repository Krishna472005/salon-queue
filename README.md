# ALL1 Salon Queue
**Live demo:** https://salon-queue-psi.vercel.app
**Demo PINs:** reception 2468 · barber 1122 · owner 1357
**Hosted on:** Vercel (frontend) + Supabase (database, Google login, realtime)

## Deploy to Vercel (Quick Steps)

1. **Push Code to GitHub:**
   Ensure this repository is pushed to your GitHub account.

2. **Import into Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new) and import this repository.
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   *(SPA deep routes like `/reception` are handled automatically by `vercel.json`)*

3. **Configure Environment Variables in Vercel:**
   Add these in Vercel Project Settings → **Environment Variables**:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_DEMO_PIN_ENABLED=true
   VITE_DEMO_RECEPTION_EMAIL=reception@all1salon.com
   VITE_DEMO_RECEPTION_PASSWORD=All1Reception2468!
   VITE_DEMO_OWNER_EMAIL=owner@all1salon.com
   VITE_DEMO_OWNER_PASSWORD=All1Owner1357!
   VITE_DEMO_BARBER_EMAIL=barber@all1salon.com
   VITE_DEMO_BARBER_PASSWORD=All1Barber1122!
   ```

4. **Deploy & Add Supabase Redirect URI:**
   - Click **Deploy**.
   - Copy your assigned Vercel URL (e.g. `https://all1-salon-queue.vercel.app`).
   - In Supabase Dashboard → **Authentication** → **URL Configuration**, add your Vercel URL to **Redirect URLs**.
   - Replace `https://YOUR-APP.vercel.app` on line 2 of `README.md` with your real Vercel URL!

## About
ALL1 is a real-time salon queue web app. Customers take a digital token on their phone, watch their wait shrink with live updates, and are called by a barber (Mahesh, Suresh or Ashlesh). Reception and barbers manage the line; a waiting-room TV displays chair status and upcoming tokens.

## Services
- **Haircut**: 60 min · ₹300
- **Beard trimming**: 40 min · ₹400
- **Facial**: 45 min · ₹750
- **Hair wash**: 20 min · ₹150
- **Massage**: 20 min · ₹200

## Quickstart

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project URL and anon public key:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Quick Demo PIN authentication (enabled by default)
VITE_DEMO_PIN_ENABLED=true
VITE_DEMO_RECEPTION_EMAIL=reception@all1salon.com
VITE_DEMO_RECEPTION_PASSWORD=All1Reception2468!
VITE_DEMO_OWNER_EMAIL=owner@all1salon.com
VITE_DEMO_OWNER_PASSWORD=All1Owner1357!
VITE_DEMO_BARBER_EMAIL=barber@all1salon.com
VITE_DEMO_BARBER_PASSWORD=All1Barber1122!
```

### 3. Database & SQL Setup
1. Open your project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor**.
3. Open `supabase/schema.sql` from this repository, copy its full content, paste it into the editor, and click **Run**.
   - This sets up tables (`settings`, `services`, `barbers`, `staff`, `queue_entries`), Row Level Security policies, the privacy-preserving `public_queue_entries` view, and centralized Postgres RPC functions (`take_token`, `add_walkin`, `call_next`, `start_service`, etc.).

### 4. Create Demo Users in Supabase Dashboard (for PIN access)
To enable the 4-digit demo PIN login on `/login` (which uses Supabase password authentication behind the scenes for realistic RLS sessions):
1. In Supabase Dashboard, navigate to **Authentication** -> **Users**.
2. Click **Add user** -> **Create user** for each of the three accounts:
   * **Reception:**
     - Email: `reception@all1salon.com`
     - Password: `All1Reception2468!`
     - Auto Confirm User: **Checked (Yes)**
   * **Owner:**
     - Email: `owner@all1salon.com`
     - Password: `All1Owner1357!`
     - Auto Confirm User: **Checked (Yes)**
   * **Barber:**
     - Email: `barber@all1salon.com`
     - Password: `All1Barber1122!`
     - Auto Confirm User: **Checked (Yes)**
> [!NOTE]
> **Post-Grading Cleanup:** Remove or disable these 3 demo accounts from Supabase Authentication once grading and evaluation are complete.

### 5. Google Login Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com) -> APIs & Services -> OAuth consent screen (choose External, add your test email).
2. Credentials -> Create Credentials -> **OAuth client ID** (Application type: Web application).
3. Under **Authorized redirect URIs**, enter the Callback URL found in Supabase (**Authentication** -> **Providers** -> **Google**).
4. Copy the Google Client ID & Client Secret and paste them into Supabase **Authentication** -> **Providers** -> **Google** and switch the toggle to **Enabled**.
5. In Supabase **Authentication** -> **URL Configuration**, add your local URL (`http://localhost:5173`) and your Vercel deployment URL to **Redirect URLs**.
6. In Supabase SQL Editor, add your Google account email to the `staff` table:
   ```sql
   insert into staff (email, role) values ('your-google-account@gmail.com', 'owner');
   ```

### 6. Run Locally
```bash
npm run dev
```

## Routes
| Route | Description | Access |
|---|---|---|
| `/` | Landing page: right now card, live barbers, menu strip, QR code | Public (Light theme) |
| `/token` | Get Token: 3-step wizard (customer, services, barber) | Public (Light theme) |
| `/t/:id` | My Token: ticket card, animated wait ring, expected time, "You're up!" takeover | Public (Light theme) |
| `/reception` | Reception board: chairs, FIFO preference queue, +walk-in modal | Staff: Receptionist / Owner (Dark theme) |
| `/barber/:name` | Barber chair: current customer timer, start/finish, break switch | Staff: Barber / Owner (Dark theme) |
| `/tv` | Waiting-room TV: large chairs display, next 5 tokens, QR code, ticker | Public (Dark theme) |
| `/owner` | Owner panel: services, barbers on duty, staff access, analytics | Staff: Owner (Dark theme) |
| `/login` | Staff sign in: Google OAuth and quick demo PIN | Public (Dark theme) |
