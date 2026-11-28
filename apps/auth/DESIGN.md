---
name: BrickBot Auth
description: "auth.brickbot.ro, the members' front door: Arena Lights seen from the inside, half floodlit arena, half quiet black desk."
colors:
  primary: "#ffec17"
  spark: "#fffbd6"
  alarm: "#ff7b8e"
  black: "#000000"
  diode: "#050505"
  surface: "#121210"
  surface-raised: "#1c1b18"
  unlit: "#1b1a17"
  ink: "#f4f1e8"
  ink-muted: "#bdb9ad"
  ink-faint: "#8e8b81"
  rule: "rgb(244 241 232 / 0.14)"
  line: "rgb(244 241 232 / 0.24)"
  scrollbar: "#3a3933"
typography:
  display:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 2.65vw, 2.4rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 116"
  headline:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 3.6vw, 3.25rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 114"
  body:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
    fontVariation: "'wdth' 100"
  fine:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontVariation: "'wdth' 100"
  hint:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    fontVariation: "'wdth' 100"
  note:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    fontVariation: "'wdth' 100"
  link:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    fontVariation: "'wdth' 110"
  label:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 700
    letterSpacing: "0.12em"
    fontVariation: "'wdth' 78"
  button:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1
    fontVariation: "'wdth' 112"
  code-digit:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    fontVariation: "'wdth' 112"
    fontFeature: "'tnum' 1"
  code-digit-mobile:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 800
    fontVariation: "'wdth' 112"
    fontFeature: "'tnum' 1"
rounded:
  focus: "4px"
  sm: "10px"
  md: "12px"
spacing:
  side-pad: "clamp(16px, 5vw, 72px)"
  desk-top: "48px"
  desk-width: "460px"
  form-gap: "20px"
  field-gap: "8px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.black}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 28px"
    height: "56px"
    width: "100%"
  input:
    backgroundColor: "{colors.black}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "56px"
  input-error:
    backgroundColor: "{colors.black}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  code-cell:
    backgroundColor: "{colors.black}"
    textColor: "{colors.ink}"
    typography: "{typography.code-digit}"
    rounded: "{rounded.sm}"
    height: "68px"
  notice:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    typography: "{typography.fine}"
    rounded: "{rounded.sm}"
    padding: "13px 16px"
  link:
    textColor: "{colors.primary}"
    typography: "{typography.link}"
---

# Design System: BrickBot Auth

## Overview

**Creative North Star: "Arena Lights", the inside view**

auth.brickbot.ro inherits Arena Lights, the system recorded in `apps/website/DESIGN.md` (detail in `apps/website/.impeccable/design-full.md`). Same black ground, same exact brand yellow, same warm-white ink and its two muted steps, same one-family Anek Latin worked across its width axis, same squircle corners. This file records what auth ships and what it adds; where it is silent, the website's system governs.

Auth is the same club seen from the inside, quieter than the public site. One screen at a time, one primary action, nothing to scroll past. The page is the **Floodlit Split**: the team under the floodlights fills the left column, and a black desk holding the current step sits on the right. It refuses the centred card on a blank page. Auth carries no LED strip: the photo is the only spectacle, and state lives in the desk's notices and field errors.

The one colour auth adds is a state colour, not a brand colour: **Alarm** (`alarm`), the same pink-red the website's contact form already uses for invalid fields and its error status. It appears only on errors.

**Key Characteristics:**
- Floodlit Split: a full-height photo on one side, a 460px desk on the other; on phones the photo becomes a short band over the desk.
- State is carried by the desk alone: notices for the step, messages under fields.
- Fields are checked when the member pauses, not on every keystroke.
- Outlined squircle inputs on black that light yellow on focus.
- One full-width yellow primary button per step, lit by the Floodlight glow at rest.
- Exact #FFEC17 for every lit element; alarm only on errors.

## Colors

The website's palette unchanged, plus one state colour for errors.

### Primary
- **Floodlight Yellow** (`primary`): the primary button, focus rings and outlines, the focused input and active code cell, text links, the wordmark and logo mark, the payoff words of the arena line, the caret and text selection. Always at full value, black text on it.
- **Spark White** (`spark`): carried from the website's tokens; auth declares it but does not paint with it.

### State
- **Alarm** (`alarm`): errors only. The border of an invalid input or of all six code cells, the field error message, and the border of an error notice. Matches the website contact form's error colour.

### Neutral
- **Venue Black** (`black`): the page, the desk, input and code-cell fills.
- **Board** (`surface`): hover fill behind the password toggle.
- **Raised Board** (`surface-raised`): the notice fill.
- **House Light** (`ink`): headings, input text, emphasised words in helper lines.
- **Dimmed House Light** (`ink-muted`): helper lines under headings, field labels, back links, footer links, the password toggle icon.
- **Faint House Light** (`ink-faint`): placeholders, field hints, the desk footer, disabled links, hovered input border.
- **Hairline** (`rule`) and **Field Line** (`line`): `line` is the resting stroke of inputs and code cells.
- **Scrollbar** (`scrollbar`): the scrollbar thumb on the black track, the same value as the website.
- **Diode Housing** (`diode`) and **Unlit Diode** (`unlit`): still declared in auth's theme for parity with the website's LED strip, but auth paints nothing with them since the strip was removed.

### Named Rules
**The Exact Yellow Rule.** Inherited: the primary is the brand yellow at full value, never tinted or shifted.

**The No Second Brand Color Rule.** Inherited and still in force. Alarm is a state colour, not a second brand colour: it marks an error and nothing else. It never fills a button, a board or a heading, and it never appears on a screen that has no error.

## Typography

**Display Font:** Anek Latin (with a metric-matched Arial fallback per width band, self-hosted woff2, `font-display: optional`)
**Body Font:** Anek Latin
**Label/Mono Font:** Anek Latin Condensed (width axis 78)

**Character:** One face, ranked by width as much as size: Expanded 800 for headings and the button, regular for reading, Condensed for labels.

### Hierarchy
- **Display** (800, clamp(1.6rem, 2.65vw, 2.4rem), 1.02, width 116): the arena line under the wordmark ("Team access, members only."), payoff words in yellow. Hidden on phones.
- **Headline** (800, clamp(2.4rem, 3.6vw, 3.25rem), 1, width 114): the one heading per step ("Sign in", "Create your account").
- **Body** (400, 1.125rem, 1.5): the optional helper line under a heading (ink-muted, emphasised words in ink 700), input text. "Sign in" has no helper line.
- **Fine** (400, 1rem): desk footer, notices.
- **Hint** (400, 0.95rem): field hints, ink-faint. Field errors sit at 0.98rem in alarm.
- **Note** (400, 0.9rem): the development-only preview note in the desk footer.
- **Label** (700, 0.86rem, 0.12em, Condensed 78, uppercase): field labels, ink-muted. Labels caption the field under them; never a kicker.
- **Button** (700, 1.15rem, width 112): the primary button.
- **Link** (700, 1.05rem, width 110): yellow text links; back links use the same 1.05rem at regular weight and width.
- **Code digit** (800, 2rem, width 112, tabular figures): the six code cells; **Code digit mobile** (1.75rem) under 900px.

### Named Rules
**The Width Is Hierarchy Rule.** Inherited: Expanded for headings and buttons, 100 for reading, Condensed for labels.

**The One Family Rule.** Inherited: Anek Latin is the only face.

## Layout

**The Floodlit Split.** From 1200px, a two-column grid in the ratio 800 : 640. The arena column is sticky at full viewport height and the photo fills all of it (object position 68% 50%). The logo mark sits at 48px / 40px and links to the website; the wordmark (clamp(240px, 30vw, 440px), nudged `translate: 0 -13.8%`) and the arena line sit at the lower left, 48px in from the side and bottom. The desk column has 48px top padding, the side padding token, a vertically centred main block at most 460px wide, and a footer with the invite-only note. There is no top row in the desk.

From 900px to 1199px the columns are equal and the arena's insets drop to 36px.

Under 900px the split stacks: the photo becomes a band clamp(200px, 32svh, 300px) high (object position 70% 40%) with the mark and wordmark 16px in and the arena line hidden; the desk follows with 16px gutters, max 520px. Works from 320px.

Inside the desk: heading, then a 12px gap to an optional helper line, then the form 36px below; fields 20px apart; label, input, hint and error 8px apart within a field. On sign-in, "Forgot password?" sits alone, right-aligned, in a row pulled 4px up under the password, above the button.

## Elevation & Depth

Flat black, like the website. Depth comes from the photo, its scrim, and light. The arena scrim darkens only where the type is: a radial at the lower left plus a thin top fade for the mark.

### Shadow Vocabulary
- **Floodlight glow** (`box-shadow: 0 10px 30px -12px rgb(255 236 23 / 0.6)`, hover `0 12px 34px -10px rgb(255 236 23 / 0.75)`): the primary button. In auth it is lit at rest, because each step has exactly one primary action, and brighter on hover. (The website reserves it for hover.)
- **Focus outline** (`outline: 2px solid` yellow, 3px offset, 4px radius): the global focus style for links and buttons, as on the website.
- **Focus ring on fields** (`box-shadow: 0 0 0 1px` in yellow, or alarm on an invalid field): doubles the 1.5px border to read as 2.5px.

### Named Rules
**The Scrim Where The Type Is Rule.** Inherited: darken only the corner the type occupies.

## Shapes

Squircles, as on the website. Every box is a plain rectangle with `corner-shape: squircle` where supported and an ordinary radius as the fallback; the radii grow inside `@supports (corner-shape: squircle)`: button 22px (fallback 12px), inputs, code cells and notices 18px (fallback 10px), the password toggle 4px inside its input. The global focus outline has a 4px radius (`focus`). Strokes are 1.5px. The spinner is the one circle.

## Components

### Buttons
- **Shape:** squircle (22px; 12px fallback), full width, 56px tall, 0 28px padding.
- **Primary:** yellow fill, black text, the Button type, an arrow icon after the label; Floodlight glow at rest.
- **Hover / Focus / Active:** glow brightens, the arrow slides 4px right; focus is a 2px yellow outline 4px off; active presses down 1px.
- **Busy:** the arrow is replaced by a 20px spinner before a short verb ("Signing in"); cursor shows progress.
- Auth ships no secondary button; text links and back links carry every other action.

### Links
- **Text link:** yellow 700, 1.5px underline 0.32em below; a button styled the same way when it acts in place ("Send a new code"). Disabled: faint, regular, no underline.
- **Back link:** ink-muted with an arrow; yellow on hover, the arrow nudges 4px in its own direction.

### Inputs / Fields
- **Style:** 56px tall, black fill, 1.5px `line` stroke, squircle (18px; 10px fallback), 0 18px padding, body type; label above in the Label style.
- **Hover:** stroke goes to ink-faint.
- **Focus:** stroke turns yellow plus a 1px yellow ring; the caret is yellow. Autofill keeps the black fill.
- **Error:** stroke turns alarm (ring alarm on focus) and an alarm message sits under the field, linked by `aria-describedby`.
- **Password toggle:** a 44px square eye button inside the field's right edge, ink-muted, yellow on a Board fill when hovered; `aria-pressed` reflects visibility. Every password field has one, including "Confirm password" on the invite page.

### Validation (paused check)
A field is checked about 900ms after typing stops, on blur when it is not empty, or on submit (empty included). Once a message is showing it stays current while the member types, and clears the moment the value is valid. Fields are never flagged on every keystroke, and an empty field is never flagged just for being focused. The invite page ("Create your account") asks for Password and Confirm password; a mismatch reads "The passwords don’t match." The reset page keeps a single password field.

### Code Input (signature)
One real input over six display cells, so paste and one-time-code autofill work. Six equal cells with a 10px gap (8px on phones), 68px tall (60px on phones), black fill, 1.5px `line` stroke, squircle, digits in the Code digit style. The active cell lights like a focused input; when empty it shows a blinking 2px yellow caret. A wrong code turns all six strokes alarm.

### Notices
The step's state, now that the desk carries it alone: Raised Board fill, 1.5px alarm border (error, `role="alert"`) or yellow border (`notice--ok`, `role="status"`), squircle, 13px 16px padding, Fine type. Links and inline buttons inside it are yellow 700 underlined. Every notice says what to do next.

### Motion
Ease `cubic-bezier(0.16, 1, 0.3, 1)` throughout. The photo settles from 1.06 scale over 1.8s once at load; each step's desk content rises 10px and fades in over 0.5s. Reduced motion stops all of it.

## Do's and Don'ts

### Do:
- **Do** use the brand yellow at full value for every lit element, with black text on it.
- **Do** keep one full-width primary button per step, lit by the Floodlight glow.
- **Do** carry state in the desk: a notice for the step, a message under the field.
- **Do** check fields after the member pauses (about 900ms), on blur or on submit, and clear the message the moment the value is valid.
- **Do** use alarm only where something failed: the invalid field, its message, the code cells, the error notice.
- **Do** make every error say what to do next.
- **Do** nudge the wordmark `translate: 0 -13.8%` beside the mark, as everywhere else in the brand.

### Don't:
- **Don't** treat alarm as a brand colour: no alarm fills, buttons, headings or decoration.
- **Don't** put the form in a centred card on a blank page; the desk sits on the black ground beside the arena.
- **Don't** validate on every keystroke or flag an empty field before blur or submit.
- **Don't** set a heading in anything but Anek Latin Expanded.
- **Don't** put a small uppercase label above a heading as a kicker; condensed labels only caption the field under them.
