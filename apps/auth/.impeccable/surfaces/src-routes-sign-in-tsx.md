---
version: 1
slug: "src-routes-sign-in-tsx"
primary_target: "src/routes/sign-in.tsx"
related_targets: ["src/routes/code.tsx","src/routes/forgot.tsx","src/routes/reset.tsx","src/routes/invite.tsx","src/components/Shell.tsx"]
---

# Sign-in flow (auth.brickbot.ro)

Mode: Operate. Audience: BrickBot members (students, mentors) arriving from the CMS redirect, an invite email or a reset email. Task: sign in, enter the emailed code on a new browser, recover a password, accept an invite. Constraints in `apps/auth/PRODUCT.md` (EN only, no sign-up, no magic link, no account settings, code on new browsers, trusted 30 days).

Decision (2026-11-27): owner locked **Floodlit Split** from a code-led surface round (Circuit Rail, Floodlit Split, LED Check-in). Sketch: `.impeccable/mocks/decision/split.html`.

Owner revision (2026-11-27, after the first build): removed the LED status strip, the "brickbot.ro →" link at the top of the desk, the helper line under "Sign in" and the "New browser? We'll email you a code." note. Fields are checked after the member stops typing. The invite page asks for password + confirmation and creates the account. These owner decisions override the contract below wherever it mentions the strip or the top link; state now lives in the desk's notices and field errors.

## Direction contract

THESIS: The front door is half arena, half desk: the team at Worlds under the floodlights on one side, a quiet black desk with the form on the other, and the LED strip under the photo doing real work as the flow's status board. It refuses the centred card on a blank page.

OWN-WORLD: Arena Lights unchanged: black ground, exact #FFEC17 for the primary button, focus, links and lit LED words; warm-white ink #F4F1E8 and its muted steps; dot-matrix LED strip (#050505 diodes, unlit #1B1A17) with logo-mark separators; outlined squircle inputs on black that light yellow on focus; Anek Latin Expanded 800 headings, Condensed for labels and LEDs, regular for reading.

STORY: Member recognises the team and the brand at once → signs in with email and password → on a new browser types the 6-digit code from their email → lands back in the CMS. Forgot password and invite acceptance live in the same frame; errors say what to do next and never reveal who is a member.

FIRST VIEWPORT: Desktop: left 800/1440 (≈55%) the Worlds practice-field photo full height, logo mark top left, scrim only at the lower left holding the yellow wordmark (~440px) and "Team access, members only." in Expanded 800, then a 54px LED strip along the photo's bottom edge reading the current status (SIGN IN lit yellow, the rest dim). Right column: "brickbot.ro →" top right; vertically centred 460px form: "Sign in" heading, one helper line, Email and Password (show toggle), "Forgot password?" yellow link, full-width yellow "Sign in →" button; invite-only note at the bottom. Phone: the photo becomes a short top band with the mark and LED strip, the form follows.

FORM: grounded structure "Floodlit Split", position 2 on the ordered list (dealt), seed: seed:afeb1cfc729c2893.
Signature interaction: the LED strip is the status board: every state change (code sent, wrong code, link expired, password set, signing you in) powers the strip off and back on dot by dot with the new message, key word lit yellow. Motion grammar: the photo settles from a slight zoom once at load; step changes cross-fade the form column; reduced motion holds the strip static and swaps text instantly.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
