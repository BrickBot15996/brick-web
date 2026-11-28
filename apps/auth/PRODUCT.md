# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

BrickBot team members only: CNU students (about 13–19) and a few mentors who edit the website and linktree in the CMS. They arrive at auth.brickbot.ro because the CMS sent them here (`?redirect=…`), from an invite email, or from a password-reset email. Usually on a laptop at school or at home; often on a phone when opening an email link. Nobody arrives here by accident, and nobody here needs to be persuaded of anything.

## Product Purpose

Let a team member get into the team's apps safely and quickly, then get out of the way. Success: a member signs in within seconds, recovers a forgotten password alone, and nobody without an invite gets in.

## Positioning

The front door of BrickBot's internal tools: the same club as the public website and links.brickbot.ro, seen from the inside. Invite-only: there is no sign-up anywhere.

## Operating Context

- Vite + React SPA, TanStack Router + Query, Tailwind, Supabase Auth (root `CLAUDE.md` §2). Session cookie scoped to `.brickbot.ro`, shared with the CMS.
- Auth emails (invite, reset, sign-in code) are sent through Resend: 3,000/month, 100/day on the free tier.
- Free tiers only.

## Capabilities and Constraints

Confirmed by the owner (2026-11-27):

- **English only.**
- **No registration.** Admins add members from the CMS Admin section; a new member receives an invite email and sets a first password.
- **Screens:** sign in (email + password) → emailed 6-digit code when the browser is new → forgot password (request email) → set a new password from the email link → accept invite. Plus their error, loading, expired-link and rate-limit states.
- **Invite (owner, 2026-11-27):** the admin's invite emails a link; opening it shows "Create your account" with password and password confirmation; submitting creates the account and signs the member straight in (the link already proved the inbox, so no code).
- **Validation:** fields are checked once the member stops typing (about a second) or leaves the field, and again on submit; an error clears the moment the value is valid.
- **2FA:** a 6-digit code emailed to the member, asked for the first time on a browser; that browser is then trusted for 30 days.
- **No magic-link login** (it would be a second way in through the same inbox).
- **No account settings:** no display name, avatar or change-password screen. A member who wants a new password uses "Forgot password".
- The app launcher from `CLAUDE.md` §6 is outside this round. After sign-in the member goes to `?redirect=` or the CMS.
- Open technical question: Supabase Auth's built-in MFA offers TOTP and phone, not email codes, so the email second factor needs a custom implementation (Edge Function + trusted-device record). To be decided when the app is built.

## Brand Commitments

Inherits the public brand: exact #FFEC17, black ground, Anek Latin, logo mark and BRICKBOT wordmark (with the optical nudge from `CLAUDE.md` §12), electric/cyber theme, dark-first. It must look like the same family as brickbot.ro and links.brickbot.ro. Voice: confident teens, plain words, short.

## Evidence on Hand

- Brand assets on `cdn.brickbot.ro/brand/` (logo.svg, wordmark.svg); Anek Latin woff2 files in `apps/website/public/fonts/`.
- Team photos in `apps/website/public/preview/` (listed in `docs/cdn-manifest.md`).

## Product Principles

1. **Seconds, not a ceremony.** Fewest fields and steps; autofill, paste and one-time-code autofill must just work.
2. **Never a dead end.** Every error says what to do next; expired links lead straight to a fresh one.
3. **Say nothing to strangers.** Messages never reveal whether an email belongs to a member.
4. **Same club, inside view.** Unmistakably BrickBot, quieter than the public site.

## Accessibility & Inclusion

WCAG 2.2 AA, including accessible authentication (3.3.8): paste allowed in every field, password managers supported, no cognitive tests. Respect reduced motion. Works from 320px wide.
