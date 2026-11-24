# ALL1 — Flows & Rules

## Flow A: customer with a phone
1. Landing → Get token → Haircut + Facial → "Any available" → token O-14, 6th in line
2. Watches My Token at home; when 2nd, gets "Head over now"
3. Reception taps Call next on Suresh's card → O-14 becomes Called
4. Phone shows "You're up! Go to Suresh"; TV flashes O-14
5. Suresh taps Start, later Finish → token closed, stats updated

## Flow B: walk-in
Reception taps + Walk-in → name, phone, services, barber → gets token W-15 at the end of the line.

## Flow C: staff sign-in
/login → Google → email looked up in `staff` table → owner→/owner, receptionist→/reception, barber→/barber/<name>. Unknown email = denied.

## Rules
1. Status path: Waiting → Called → In chair → Done (never backwards). Waiting → Cancelled. Called → No-show.
2. Order is by join time (first come, first served).
3. Call next for barber X = earliest Waiting customer whose choice is X or "Any available".
4. A customer who chose Mahesh is never given to Suresh or Ashlesh.
5. A barber handles one customer at a time (Called or In chair counts as busy).
6. Wait estimate = (sum of minutes of everyone ahead, plus time left on current chairs) ÷ barbers working now.
7. One active token per phone number.
8. Max 4 services per token; only services that are switched on.
9. Called but absent after 8 minutes → reception may mark No-show. "I'm running late" adds 5 minutes, once.
10. A no-show who returns takes a NEW token at the end of the line.
11. Online tokens stop 20 minutes before closing; walk-ins still allowed. Salon hours: 10:00–21:00.
12. Barber on break: their loyal customers see "on a short break"; the barber isn't counted in the wait estimate.
13. Token prefix: O- for online, W- for walk-in; the number counter resets each day.
14. Permissions: owner edits settings; receptionist manages the line; a barber only controls their own customers.
15. Stored in UTC, shown in Asia/Kolkata.

## Test checklist
[ ] Haircut + Facial shows 105 min and ₹1050
[ ] Selecting a 5th service is blocked; a 9-digit phone is blocked
[ ] Same phone taking a second token opens the existing one
[ ] Call next for Suresh skips a customer who chose Mahesh
[ ] Called customer's phone shows "You're up!" within 5 seconds
[ ] Start/Finish on the barber phone updates reception and TV within 5 seconds
[ ] "I'm running late" works once and extends the no-show timer by 5 min
[ ] No-show then new token goes to the end of the line
[ ] Release token removes the person from reception and TV
[ ] Pausing online tokens disables Get token with a message; walk-in still works
[ ] Switching a service off hides it from the menu and Get Token
[ ] Gujarati toggle changes all text without overflow
[ ] Wait time drops as customers finish
[ ] Phone, tablet and TV stay in sync
[ ] A non-staff Google account cannot open /reception or /owner
[ ] Refreshing /reception on the live link does not give 404
[ ] Data survives refresh and browser restart
