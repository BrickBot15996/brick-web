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

<!-- impeccable:design-map -->
Name: BrickBot
Colors: primary: primary #ffec17; neutral: black #000000; primary: spark #fffbd6; neutral: diode #050505; neutral: surface #121210; neutral: surface-raised #1c1b18 (+5 more in the sidecar)
Fonts: Anek Latin (display, headline-xl, headline, headline-sm, title, lead, body, label, led, led-display)
Spacing: gutter clamp(16px, 3.05vw, 44px), grid-gap 24px, section clamp(96px, 11vw, 176px), nav 76px, strip 54px, max-width 1440px; corners squircle (board 44px, button 22px, small 18px, inner 16px) with rounded fallback (22 / 12 / 10 / 8px)
Radius: inset 6px, item 8px, sm 10px, md 12px
North Star: "Arena Lights"
Rules:
- The Exact Yellow Rule. The primary is the brand yellow at full value.
- The No Second Brand Color Rule. Burgundy is not used. A highlighted board is surface-raised with a 1px yellow hairline ring; solid yellow fill stays reserved for primary CTAs.
- The Lit Fact Rule. On an LED strip, only the key fact is yellow; the rest of the run is dim warm-white.
- The Width Is Hierarchy Rule. Rank comes from the width axis as much as size: Expanded (108–118) for headings and buttons, 100 for reading, Condensed (76–80) for LEDs and labels.
- The One Family Rule. Anek Latin is the only face.
- The Scrim Where The Type Is Rule. Over a hero photo, darken only the corner the type occupies (a radial at lower left on desktop, a bottom gradient on phones) plus a thin top fade for the nav.
Elevation:
- Floodlight glow: 0 10px 30px -12px rgb(255 236 23 / 0.6)
- Pulse glow: filter: drop-shadow(0 0 3px #ffec17) drop-shadow(0 0 8px rgb(255 236 23 / 0.6))
- Photo legibility: drop-shadow(0 4px 24px rgb(0 0 0 / 0.35))
Don't:
- Don't tint, shift, or recolor the primary yellow, or invent a second yellow for fills.
- Don't flood boards with solid yellow; it is the primary-CTA fill only.
- Don't set a heading in anything but Anek Latin Expanded, or LED text in anything but Condensed.
- Don't add rounded cards, pills, glassmorphism, or soft drop-shadow elevation; containers are boards.
- Don't use emoji or glyph icons as LED separators or decoration; use the logo mark.
- Don't put a small uppercase label above a heading as a kicker; condensed labels only caption the data under them.
- Don't draw more than one zigzag on an arc; the lightning lives in the arc, the LED strips and the logo mark.
Do:
- Do use the brand yellow at full value for every lit element, and black text on it.
- (+6 more)
Full: .impeccable/design-full.md (read a section when you need its detail)
