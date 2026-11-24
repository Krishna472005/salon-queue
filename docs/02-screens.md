# ALL1 — Screens

Common to all: header with ALL1 logo + language switch [EN | ગુ]; toast messages; skeleton loading;
friendly empty and error states ("Reconnecting…").
Look & fonts: see docs/04-design-system.md.

## S1 — Landing (/) · phone · light theme
- Navy gradient banner with ALL1 logo, tagline, status badge "● Taking tokens · Closes 9 PM" (or "Online tokens paused")
- "Right now" card: "5 in line · about 1 hr 10 min" with a live pulsing dot
- Three barber tiles: Mahesh · Suresh · Ashlesh — each with a status dot (Working / Free / On break) and own wait time
- Menu strip: the 5 services with icon, time and price
- Main coral button [ Get my token ] (disabled + reason when closed)
- QR code card that opens /token for quick access
- Link: "Already have a token? Find it" (enter phone number opens "Find my token" modal)
- Footer link: Staff login

## S2 — Get Token (/token) · phone
- 3-step bar: You → Services → Barber
- Step 1: Name, Phone (10 digits, +91 shown); optional [Continue with Google] to prefill
- Step 2: service cards (tap to select, up to 4): Haircut 60 min ₹300 · Beard trimming 40 min ₹400 · Facial 45 min ₹750 · Hair wash 20 min ₹150 · Massage 20 min ₹200
- Step 3: "Any available barber" or Mahesh / Suresh / Ashlesh cards showing their current wait
- Sticky footer: "2 services · 100 min · ₹700 · wait ≈ 45 min"
- [ Confirm token ] → goes to S3
- Errors: bad phone, no service, more than 4, online tokens paused, phone already has an active token (open that one instead)

## S3 — My Token (/t/:id) · phone
- Ticket-style card with big token (e.g. O-14) and customer name
- "You are 4th" + circular wait ring "about 45 min" that refreshes by itself, with expected turn time (e.g. "around 6:45 PM") displayed next to the wait ring
- Progress line: Waiting → Head over → Called → In chair → Done
- When 2nd: banner "Head over now — you're nearly up"
- When called: full-screen takeover "You're up! Go to Suresh" with pulse, vibration, sound
- After called: [ I'm running late ] (once, +5 min before auto no-show)
- If chosen barber is on break: "Mahesh is on a short break"
- If marked no-show: "Your turn passed" + [Take a new token]
- [ Release my token ] with confirmation dialog
- Token id remembered in browser so refresh keeps the page

## S4 — Reception Board (/reception) · 10" tablet landscape · dark theme · Google (receptionist/owner)
- Top bar: [ + Walk-in ], online-tokens pill (On/Paused), clock
- Left: 3 barber cards (Mahesh, Suresh, Ashlesh): current customer, progress bar of time left, [ Call next ]
- Right: waiting list in order: token, name, services, preferred barber, time waiting, [ No-show ] [ Remove ]
- Rows waiting over 75 min turn amber; called rows show an 8-minute countdown
- Empty state: "Nobody waiting — walk right in!"

## S5 — Barber Screen (/barber/:name) · phone · dark · Google (that barber / owner)
- Current customer: name, services, timer since start
- Large [ Start ] then [ Finish ] buttons (56px tall)
- "Up next for you: O-15 Kunal (Haircut + Wash)"
- Switch: Take a break / Back to work
- Small counter: served today

## S6 — Waiting-Room TV (/tv) · 1080p landscape · dark · no login
- Header: logo, clock, open/close badge
- One big row per barber: photo, name, "Now serving O-12" (aqua ring when busy)
- "Next in line": 5 tokens with estimated times, very large type
- QR code that opens /token for quick phone token booking
- New call flashes coral→aqua with a chime ("Tap to enable sound" overlay on first load)
- Bottom ticker: menu highlights, e.g. "Facial ₹750 · 45 min"

## S7 — Owner Panel (/owner) · tablet/laptop · dark · Google (owner only)
- Services: add/edit/switch off (name EN+GU, minutes, price)
- Barbers: who is working today, photo upload, linked Google email
- Online tokens On/Paused + opening hours
- Staff access list (email + role)
- Today: customers served, average wait, no-shows, busiest hour mini chart

## S8 — Staff Login (/login)
- [ Continue with Google ]; unknown email → "No access. Ask the owner."
- Demo PIN box only if VITE_DEMO_PIN_ENABLED=true (reception 2468, owner 1357, barber 1122)
