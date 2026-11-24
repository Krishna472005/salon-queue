# ALL1 — Design System ("Ocean & Coral")

## Brand
- Name: **ALL1** (ઓલ વન). Meaning: all grooming services, one place.
- Tagline: "Everything. One chair. Zero guessing." / "બધું એક જ જગ્યાએ. રાહ વગર."
- Logo: rounded-square badge in navy→cobalt gradient; wordmark "ALL" in white and a coral "1" whose
  stem has a small scissor-gap cut-out. Provide logo.svg (colour), logo-light.svg, favicon.svg.
- Icons: lucide-react (scissors, droplets, sparkles, hand, bell, clock, user).

## Colour tokens (tailwind `all1.*`)
| Token | Hex | Use |
|---|---|---|
| navy | #0B1F3A | main dark background |
| deep | #12294D | dark cards |
| cobalt | #2F6BFF | primary info, links, selected state |
| aqua | #22D3EE | "free / busy ring / active" accents |
| coral | #FF6F59 | main call-to-action, "called" state |
| lime | #A3E635 | success, open badge |
| sun | #FFC857 | warning (long wait) — soft yellow, not gold |
| rose | #F43F5E | errors, no-show |
| snow | #F6F9FC | light background |
| cloud | #E3EAF3 | light borders/cards |
| ink | #14213D | text on light |
| fog | #9FB0C9 | secondary text on dark |

Gradients: hero = navy→deep→cobalt (diagonal); turn = coral→sun; ring = aqua→cobalt.
Customer pages: light (snow). Staff and TV: dark (navy). Text contrast ≥ 4.5:1.
Status colours: Waiting cobalt · Called coral (pulse) · In chair aqua · Done grey · No-show rose · Cancelled grey.

## Typography
- Headings: **Sora** · Body: **DM Sans** · Token numbers: **JetBrains Mono** bold
- Gujarati: **Noto Sans Gujarati**
- Sizes: phone body 16px; TV body ≥ 28px, tokens ≥ 96px.

## Shape & motion
- Cards radius 18px, buttons 12px, soft blue-tinted shadows.
- Subtle diagonal-stripe or dot pattern on hero (barber-pole inspiration).
- Motion: live pulse dot, wait ring animation, list reorder, "You're up!" confetti + shimmer, TV flash. Honour prefers-reduced-motion.

## Voice (EN / GU)
- Primary button: "Get my token" / "મારું ટોકન લો"
- Waiting: "Relax — we'll call you." / "આરામ કરો, અમે બોલાવીશું."
- Nearly: "Head over now — you're nearly up." / "હવે આવો, તમારો વારો નજીક છે."
- Called: "You're up! Go to Suresh." / "તમારો વારો! સુરેશ પાસે જાઓ."
- Empty: "Nobody waiting — walk right in!" / "કોઈ રાહમાં નથી — સીધા આવો!"
- Paused: "Online tokens are paused. Walk-ins are welcome." / "ઓનલાઇન ટોકન બંધ છે. સીધા આવી શકો છો."
- Done: "Fresh and sharp! See you soon." / "તાજા અને સ્માર્ટ! ફરી મળીશું."

## Images
Barber avatars: initials on gradient until real photos are uploaded to Supabase Storage.
