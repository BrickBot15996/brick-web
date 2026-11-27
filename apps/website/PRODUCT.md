# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The website (brickbot.ro, EN + RO) is first of all for **people who have never heard of BrickBot** and might work with the team:

- **National sponsors and companies outside Vrancea.** Local businesses in Vrancea already know the team through direct contact, so the site does not need to win them over.
- **Potential collaborators who aren't funders.** Schools, organisations, event organisers and partners for the team's outreach initiatives (BrickBot in Schools, public events, meetups with other teams).

Secondary audiences, which the site serves but should not be designed around:

- CNU students. The team recruits them in person at the school, so the site is rarely their first contact.
- The FTC community: other teams, judges and mentors. They know the team through competitions.
- Parents and the school.

The visitor is usually a stranger who arrives from a link, a search, a LinkedIn post or a pitch email, and decides in a few seconds whether this team is serious and worth working with.

## Product Purpose

Introduce BrickBot to strangers and turn them into supporters: sponsors (money or services, formalised by a contract with Asociația BrickBot), donors (Stripe, or 3.5% of income tax through Form 230), or outreach partners.

Success: a first-time visitor understands who BrickBot is, believes the team is capable and active, and takes the **Support** path (sponsor or donate) or gets in touch.

## Positioning

FIRST Tech Challenge team #15996 from "Unirea" National College, Focșani, Romania. It was the first FTC team in Vrancea county and has been active since 2016. The students design, build and program a competition robot every season. They also run the team's events, social media, design, photo/video and fundraising, and teach robotics in local primary schools.

Recent record (legacy data):
- 2025–26 DECODE: Division Finalist Alliance and Design Award 2nd place at the FIRST Championship (Worlds) in May 2026, Finalist Alliance at the Romania National Championship, Think Award 2nd place at the East League Tournament, Finalist Alliance at the Bucharest Twin Cup.
- 2024–25: SparkHope Robotics Cup winners, Innovate Award 2nd place at the Italy Championship.
- Awards going back to 2016–17 are in `docs/legacy-content/data/seasons-data.tsx`.

## Operating Context

- Static Astro site, bilingual with translated slugs. Content comes from Supabase at build time, managed in the CMS. Details in the root `CLAUDE.md`.
- Media lives on `cdn.brickbot.ro`. Before launch, agents request files in `docs/cdn-manifest.md`, and local preview copies are served from `public/preview/`.
- Free tiers only.
- The CMS manages the home page's modules, impact numbers and FAQ. Copy written now is a seed that the team will edit later.

## Capabilities and Constraints

- Navigation and sitemap are fixed by `CLAUDE.md` §3. Projects are deferred and stay out of navigation.
- Mandatory site-wide: footer with ANPC SAL/ODR badges and the Nație prin Educație logo bar.
- No public phone number. The only public email is `contact@brickbot.ro`.
- Impact numbers are entered manually in the CMS. Never compute or invent them.
- Main action on the home page: **Support**, which covers sponsoring and donating.

## Brand Commitments

- Primary yellow **#FFEC17**, used exactly as given. Other yellows are allowed, but the primary must be this one (the owner relaxed CLAUDE.md's rule on 2026-11-26).
- Black background (a near-black is allowed). Burgundy #4C0414 as secondary, which may be brightened.
- Theme: electric / cyber. Lightning bolts and energy are part of the brand.
- Dark-first.
- Existing logo (a bolt inside a brick ring) and the BRICKBOT wordmark, served from `brand/`.
- Legacy tagline "We build our future Brick by Brick!", which may be reworked.
- **Typeface: Anek Latin**, the team's usual font, in its regular, condensed and expanded widths (variable `wdth` 75–125, `wght` 100–800). Other faces may sit beside it or replace it in a role, but Anek Latin is the default (owner, 2026-11-26).
- **People first in the hero.** The student photo leads and stays unobstructed by graphics. The hero holds the BRICKBOT wordmark with the motto below it, a primary "Support us" button with a secondary button to the contact form beside it, and a line at the bottom saying the team is from Focșani, Romania and finished top 10 in the world last season (owner, 2026-11-26).
- **Voice: confident teens, plain words.** It reads as written by the students: direct, a bit cheeky, concrete facts. Never corporate, never a kids' brand.
- Memorable and with personality, never generic, but accessible.

## Evidence on Hand

- Real photos (preview copies in `apps/website/public/preview/`, listed in `docs/cdn-manifest.md`): nationals celebration 2026, worlds practice field, DECODE and BioBuzz team photos, Italy 2025, students repairing the robot, drive team, event stand, sponsor visit, BrickBot in Schools classroom photos, SparkHope 2025 win.
- 22 sponsor logos from 2025–26.
- Awards per season (legacy data).
- Impact numbers (people reached, events): **not available yet**. Do not fabricate them. Use clearly labelled placeholders or leave them out.
- Testimonials and quotes: **none**. Do not invent any.

## Product Principles

1. **Strangers first.** Every screen should make sense to someone who has never heard of FTC or Focșani.
2. **Prove it with the real thing.** Real results, real photos, the real robot. No claims we can't back.
3. **Students' voice, organisation's reliability.** The tone is teen and direct. The facts (legal entity, contract, IBAN) feel trustworthy.
4. **Support is the destination.** Each path should lead to sponsoring, donating or getting in touch.

## Accessibility & Inclusion

WCAG 2.2 AA. Yellow on black and black on yellow are both high-contrast; burgundy needs checking for text. Respect reduced motion. The site is fully bilingual, so the layout must take Romanian strings, which run longer.
