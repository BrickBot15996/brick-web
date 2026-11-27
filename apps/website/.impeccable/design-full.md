---
name: BrickBot
description: "Website of FTC Team #15996 BrickBot, a floodlit arena at the moment of the win, with LED perimeter boards and one live arc of current."
colors:
  primary: "#ffec17"
  spark: "#fffbd6"
  black: "#000000"
  diode: "#050505"
  surface: "#121210"
  surface-raised: "#1c1b18"
  unlit: "#1b1a17"
  ink: "#f4f1e8"
  ink-muted: "#bdb9ad"
  ink-faint: "#8e8b81"
  rule: "rgb(244 241 232 / 0.14)"
typography:
  display:
    fontFamily: "Anek Latin, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4.05vw, 3.85rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 118"
  headline-xl:
    fontFamily: "Anek Latin, system-ui, sans-serif"
    fontSize: "clamp(2.3rem, 5.4vw, 5.25rem)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 116"
  headline:
    fontFamily: "Anek Latin, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.9vw, 3.6rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 112"
  headline-sm:
    fontFamily: "Anek Latin, system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 2.3vw, 2.15rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 108"
  title:
    fontFamily: "Anek Latin, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 2.3vw, 2.1rem)"
    fontWeight: 800
    lineHeight: 1.04
    fontVariation: "'wdth' 114"
  lead:
    fontFamily: "Anek Latin, system-ui, sans-serif"
    fontSize: "clamp(1.15rem, 1.45vw, 1.32rem)"
    fontWeight: 400
    lineHeight: 1.55
    fontVariation: "'wdth' 100"
  body:
    fontFamily: "Anek Latin, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
    fontVariation: "'wdth' 100"
  label:
    fontFamily: "Anek Latin, system-ui, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 700
    letterSpacing: "0.12em"
    fontVariation: "'wdth' 78"
  led:
    fontFamily: "Anek Latin, system-ui, sans-serif"
    fontSize: "23px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.08em"
    fontVariation: "'wdth' 76"
  led-display:
    fontFamily: "Anek Latin, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 5vw, 4.4rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "0.05em"
    fontVariation: "'wdth' 76"
rounded:
  inset: "6px"
  item: "8px"
  sm: "10px"
  md: "12px"
spacing:
  gutter: "clamp(16px, 3.05vw, 44px)"
  grid-gap: "24px"
  section: "clamp(96px, 11vw, 176px)"
  nav: "76px"
  strip: "54px"
  max-width: "1440px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.black}"
    rounded: "{rounded.md}"
    padding: "0 28px"
    height: "56px"
  button-ghost:
    backgroundColor: "rgb(0 0 0 / 0.28)"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 28px"
    height: "56px"
  button-ghost-hover:
    textColor: "{colors.primary}"
  button-dark:
    backgroundColor: "{colors.black}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "0 28px"
    height: "56px"
  button-sm:
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "44px"
  board:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  board-raised:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
  board-yellow:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.black}"
  led-strip:
    backgroundColor: "{colors.diode}"
    textColor: "{colors.ink}"
    typography: "{typography.led}"
    height: "{spacing.strip}"
---

# Design System: BrickBot

## Overview

**Creative North Star: "Arena Lights"**

The site is a floodlit venue at the moment of the win. The ground is pure black, real crowd and team photographs carry the emotion full-bleed or inside "board" frames, and the team's facts run on slim dot-matrix LED strips like the perimeter boards sponsors already understand as visibility. Electricity is present but disciplined: one thin arc of current with a single zigzag, a pulse that travels it, and a spark that runs the edge of whatever button the visitor is about to press.

People come first. The photo leads and stays unobstructed; graphics sit around it, never over faces. Density is low and paced: one idea per section, big Expanded headings, short reading columns, generous section spacing. Yellow is the light in the room and is rationed so that it reads as the lit thing, never as wallpaper.

Everything is one typeface, Anek Latin, worked across its width axis: Expanded for shouting, regular for reading, Condensed for anything that lives on an LED or a board label. The geometry is calm: plain panels with squircle corners, so the photos, the LEDs and the arc carry the energy.

**Key Characteristics:**
- Pure black ground (#000) with warm near-black boards; no gradients as decoration.
- Full-bleed, people-first photography with the scrim confined to where the type sits.
- Plain "board" panels with squircle corners (rounded where `corner-shape` is unsupported).
- Dim warm-white dot-matrix LED strips; only the key fact is yellow.
- One arc of current with one zigzag and one travelling pulse.
- Anek Latin only, width axis as the hierarchy.
- One load sequence, then quiet; reduced motion holds everything still.

## Colors

A black venue lit by one exact yellow, warm-white light.

### Primary
- **Floodlight Yellow** (`primary`): the brand yellow, used exactly as given and never tinted, shifted or overlaid. It is the wordmark, the motto's payoff words, primary buttons, link text, the arc, the hover ring on linked boards, the key fact on an LED, the closing call-to-action board and every hover and focus state.
- **Spark White** (`spark`): the hot core of a pulse only, at the leading point of the arc pulse and the button spark. Never a fill or text color.

### Secondary

### Neutral
- **Venue Black** (`black`): page ground, nav when scrolled, the mobile menu, text on yellow.
- **Diode Housing** (`diode`): the body of every LED strip, readout and perimeter band.
- **Board** (`surface`): default board fill and dropdown menu.
- **Raised Board** (`surface-raised`): the secondary board and the hovered menu row.
- **Unlit Diode** (`unlit`): the dot pattern of unlit LEDs and the hairlines inside a board's table.
- **House Light** (`ink`): headings and body text; also the color of lit LED text.
- **Dimmed House Light** (`ink-muted`): supporting paragraphs, secondary links, footer links.
- **Faint House Light** (`ink-faint`): condensed labels, column heads, legal line.
- **Hairline** (`rule`): section dividers, list separators, footer borders.

### Named Rules
**The Exact Yellow Rule.** The primary is the brand yellow at full value. Its only companions are Spark White at a pulse's core and black text on top of it. Never tint, darken, or alpha it into a fill (a soft glow on a hovered primary button and the pulse drop-shadow are the only translucent uses).

**The No Second Brand Color Rule.** Burgundy is not used. A highlighted board is `surface-raised` with a 1px yellow hairline ring; solid yellow fill stays reserved for primary CTAs.

**The Lit Fact Rule.** On an LED strip, only the key fact is yellow; the rest of the run is dim warm-white. A strip that is all yellow has no headline.

## Typography

**Display Font:** Anek Latin (with system-ui, sans-serif)
**Body Font:** Anek Latin
**Label/LED Font:** Anek Latin, condensed

Self-hosted variable woff2 (wdth 75–125, wght 100–800), split into latin and latin-ext subsets so Romanian diacritics are covered.

**Character:** one family played across its width axis. Expanded 800 gives headings a wide, stadium-signage stance; regular width keeps reading calm; Condensed uppercase with open tracking makes LEDs and labels feel like scoreboard hardware.

### Hierarchy
- **Display** (800, clamp(2rem, 4.05vw, 3.85rem), 0.98, wdth 118): the hero motto under the wordmark; payoff words in yellow. Narrows to wdth 104 on phones (96 in Romanian) so it never breaks a word.
- **Headline XL** (800, clamp(2.3rem, 5.4vw, 5.25rem), 0.98, wdth 116): the one or two statement headings per page (who we are, the support ask). The closing board heading uses the same voice.
- **Headline** (800, clamp(2rem, 3.9vw, 3.6rem), 1, wdth 112): standard section headings.
- **Headline SM** (700, clamp(1.45rem, 2.3vw, 2.15rem), 1.08, wdth 108): minor section headings.
- **Title** (800, clamp(1.5rem, 2.3vw, 2.1rem), 1.04, wdth 114): titles inside boards. Smaller list titles run 700 at ~1.15–1.2rem, wdth 108.
- **Lead** (400, clamp(1.15rem, 1.45vw, 1.32rem), 1.55): the paragraph that follows a heading; max ~52ch.
- **Body** (400, 1.125rem, 1.6, wdth 100): reading text; max 44–60ch.
- **Label** (700, 0.82–0.86rem, 0.1–0.12em, wdth 78, uppercase): definition-list terms, table column heads, readout captions, footer column heads. Always describes data that follows it.
- **LED** (700, 23px / 20px on phones, 0.08em, wdth 76, uppercase): running text on LED strips.
- **LED Display** (800, clamp(2.4rem, 5vw, 4.4rem), 0.95, wdth 76, uppercase): the one headline fact on a readout, masked to dots.

### Named Rules
**The Width Is Hierarchy Rule.** Rank comes from the width axis as much as size: Expanded (108–118) for headings and buttons, 100 for reading, Condensed (76–80) for LEDs and labels. Never set reading text condensed or LED text expanded.

**The One Family Rule.** Anek Latin is the only face. No second display font, no system display fallback chosen on purpose.

## Layout

A 12-column grid inside a 1440px container with a fluid gutter (`spacing.gutter`) and 24px gaps. Sections are separated by large, fluid vertical space (`spacing.section`), often halved or reduced where two sections belong together. Compositions are asymmetric: headings span 7–10 columns with a 13–19ch measure, text columns take 4–5, photos and boards take 6–7, and text columns stick beside tall image stacks on desktop (sticky at nav height + 32px).

The hero fills the viewport (min 640px, 100svh) with the photo full-bleed behind and the LED strip pinned to its base; the copy sits bottom-left. The fixed nav is 76px, transparent over a soft top fade until scrolled, then 94% black with a hairline.

Responsive: the desktop nav collapses to a menu button at 1140px; at 1020px sticky columns become static and grids stack to full width; at 760px everything is one column, the strip is 48px, board corners shrink (34px squircle / 18px rounded), and the hero scrim moves to the bottom. At 480px the nav's Support button hides (the hero carries it).

## Elevation & Depth

Flat by default. Depth comes from tonal stepping (black → diode → board → raised board), from photographs, and from light: the scrim, the hover ring and the pulse glow. Shadows are a response to state or a legibility aid over photos, never structural.

### Shadow Vocabulary
- **Floodlight glow** (`box-shadow: 0 10px 30px -12px rgb(255 236 23 / 0.6)`): hovered primary button only.
- **Pulse glow** (`filter: drop-shadow(0 0 3px #ffec17) drop-shadow(0 0 8px rgb(255 236 23 / 0.6))`): the arc's travelling pulse.
- **Photo legibility** (`drop-shadow(0 4px 24px rgb(0 0 0 / 0.35))` on the wordmark; `text-shadow: 0 2px 28px rgb(0 0 0 / 0.45)` on the motto): only over the hero photo.

### Named Rules
**The Scrim Where The Type Is Rule.** Over a hero photo, darken only the corner the type occupies (a radial at lower left on desktop, a bottom gradient on phones) plus a thin top fade for the nav. Faces stay in clean light.

## Shapes

One corner language: **squircles**. Every box is a plain rectangle whose corners use `corner-shape: squircle` where the browser supports it, with an ordinary `border-radius` as the fallback. A squircle reads smaller than a circular arc of the same radius, so the radius tokens grow inside `@supports (corner-shape: squircle)`:

| Token | Fallback (rounded) | Squircle | Used on |
|---|---|---|---|
| `--r-board` | 22px (18px ≤760) | 44px (34px ≤760) | boards, the nav dropdown |
| `--r-btn` | 12px | 22px | buttons (the spark ring is `--r-btn` + 4px) |
| `--r-sm` | 10px | 18px | small buttons, icon buttons, nav links, menu rows, social icons |
| `--r-inner` | 8px | 16px | screens and readouts nested in a board |

No notches, chamfers or clipped shapes on containers. The lightning lives in the arc, the LED strips and the logo mark. Nothing is pill-shaped and nothing is fully square except the LED strips and perimeter band, which run edge to edge.

The arc is a single 1.5px yellow line across the width with one zigzag at a chosen point; it sits on top of an LED strip or band.

## Components

### Buttons
Confident and lit: Expanded 700 labels with a trailing arrow that nudges 4px on hover.
- **Shape:** rounded rectangle (`rounded.md`; `rounded.sm` for the small size), 56px tall (44px small).
- **Primary:** yellow fill, black label. The main action on any screen.
- **Ghost:** translucent black fill with a 1.5px warm-white inset ring; turns label and ring yellow on hover. The secondary action beside a primary, or the action inside a text column.
- **Dark:** black fill, yellow label, used only on the yellow closing board.
- **Hover / Focus ("current"):** a conic spark runs around a ring 4px outside the button (1.1s per lap); on the dark variant the spark is black. Focus also gets a 2px yellow outline offset 6px. Active presses down 1px. Under reduced motion the ring is a static yellow outline.

### Boards (signature container)
- **Corner Style:** squircle `--r-board` (see Shapes).
- **Background:** `surface` by default, `surface-raised` for a secondary board, `primary` for the closing call to action. Photo boards are a figure with the image cropped to cover.
- **Hover / Focus:** linked boards lift 4px and gain a 1.5px yellow inset ring.
- **Internal Padding:** 24–40px fluid; the scoreboard uses 12px around its screen.
- **Linked boards:** the whole board is the link.

### LED strip (signature component)
- **Style:** `diode` housing with a 3px grid of unlit dots; lit text is masked to the same dot grid. Condensed uppercase, dim warm-white, with only the key fact yellow.
- **Separators:** the BrickBot logo mark in yellow, never emoji or glyph icons.
- **Behaviour:** scrolls slowly (110s per loop), powers on dot by dot once at load, has a 44px pause control on the right (WCAG 2.2.2). Moving text is aria-hidden; a plain sentence carries the facts for assistive tech.
- **Variants:** the readout (larger 4–5px dots, one LED Display fact under a label) and the perimeter band (taller band scrolling partner logos at 78% opacity, full on hover, pausing on hover or focus).

### Arc of current (signature component)
One thin yellow line with a single zigzag, laid along the top of a strip or band. A short Spark White pulse with a yellow glow travels it every 5.2s after a 1.6s delay. It draws itself in once during the hero load. Under reduced motion the pulse is removed and the line stays.

### Inputs / Fields
No fields ship yet. Disclosure rows (FAQ) are the nearest pattern: hairline-separated rows, Expanded 700 question, a plus that rotates into a minus, yellow when open or hovered.

### Navigation
- **Bar:** brand lockup (yellow logo mark + wordmark, drawn as masks over the exact yellow), 1.14rem, weight 600, width 106 links in warm-white with a soft dark text-shadow for legibility over photos that turn yellow on hover and for the current page, condensed uppercase language switch, small primary Support button. The wordmark's box reaches up and right for the bolt over the I and the arm of the T, so its letters sit ~14% of its height below the box centre; the nav wordmark is translated up 13.8% to centre the letters on the logo mark, and the hero wordmark is nudged left 1.2% so the B's stem aligns with the motto.
- **Dropdown:** a squircle menu on `surface` with a soft drop shadow, rows highlight to `surface-raised` with yellow text.
- **Mobile:** a 44px menu button whose two bars cross; a full-height black panel with grouped Expanded links and condensed group labels.

### Links
Yellow, 700 Expanded, 1.5px underline offset 0.32em, with a trailing arrow that nudges on hover.

## Do's and Don'ts

### Do:
- **Do** use the brand yellow at full value for every lit element, and black text on it.
- **Do** let the photograph lead; keep faces clear of type and scrim.
- **Do** frame photos and grouped content as plain squircle boards.
- **Do** put facts on LED strips with exactly one yellow fact and logo-mark separators, always with a pause control.
- **Do** keep one arc per strip or band, with one zigzag and one pulse.
- **Do** run motion as one load sequence (photo settles from 1.07 scale, wordmark wipes in, motto lines rise, actions rise, strip powers on, arc draws, pulse starts), then only quiet 26px heading reveals on scroll.
- **Do** honour reduced motion by holding everything static: no scrolling strips, no pulse, no reveals.

### Don't:
- **Don't** tint, shift, or recolor the primary yellow, or invent a second yellow for fills.
- **Don't** flood boards with solid yellow; it is the primary-CTA fill only.
- **Don't** set a heading in anything but Anek Latin Expanded, or LED text in anything but Condensed.
- **Don't** add rounded cards, pills, glassmorphism, or soft drop-shadow elevation; containers are boards.
- **Don't** use emoji or glyph icons as LED separators or decoration; use the logo mark.
- **Don't** put a small uppercase label above a heading as a kicker; condensed labels only caption the data under them.
- **Don't** draw more than one zigzag on an arc; the lightning lives in the arc, the LED strips and the logo mark.
