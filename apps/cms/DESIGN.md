---
name: BrickBot CMS
description: "cms.brickbot.ro, the team's control room: Arena Lights on a working desk, one lit jump field, a quiet icon rail and one yellow Publish."
colors:
  primary: "#ffec17"
  spark: "#fffbd6"
  alarm: "#ff7b8e"
  black: "#000000"
  surface: "#121210"
  surface-raised: "#1c1b18"
  ink: "#f4f1e8"
  ink-muted: "#bdb9ad"
  ink-faint: "#8e8b81"
  rule: "rgb(244 241 232 / 0.14)"
  line: "rgb(244 241 232 / 0.24)"
  ghost-line: "rgb(244 241 232 / 0.62)"
  scrim: "rgb(0 0 0 / 0.78)"
  scrollbar: "#3a3933"
typography:
  display:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "2.7rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 116"
  headline:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 116"
  page-title:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 116"
  title:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'wdth' 114"
  section-title:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.15
    fontVariation: "'wdth' 112"
  jump:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 400
    fontVariation: "'wdth' 100"
  body:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
    fontVariation: "'wdth' 100"
  input:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    fontVariation: "'wdth' 100"
  item:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 700
    lineHeight: 1.2
    fontVariation: "'wdth' 106"
  button:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1
    fontVariation: "'wdth' 112"
  label:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 700
    letterSpacing: "0.12em"
    fontVariation: "'wdth' 78"
  caption:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    letterSpacing: "0.14em"
    fontVariation: "'wdth' 78"
  tag:
    fontFamily: "Anek Latin, Anek Latin Fallback, system-ui, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
    fontVariation: "'wdth' 78"
rounded:
  inner-min: "4px"
  sm: "10px"
  tile: "10px"
  btn: "12px"
  md: "12px"
  row: "12px"
  pop: "12px"
  sm-squircle: "18px"
  tile-squircle: "16px"
  btn-squircle: "22px"
  md-squircle: "24px"
  row-squircle: "18px"
  pop-squircle: "24px"
spacing:
  rail: "68px"
  rail-open: "240px"
  header: "92px"
  topbar: "60px"
  gutter: "40px"
  gutter-phone: "16px"
  home-column: "880px"
  list-column: "380px"
  editor-column: "820px"
  field-gap: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.black}"
    typography: "{typography.button}"
    rounded: "{rounded.btn}"
    padding: "0 20px"
    height: "44px"
  button-primary-disabled:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.btn}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.btn}"
    padding: "0 20px"
    height: "44px"
  button-ghost-hover:
    textColor: "{colors.primary}"
  button-sm:
    padding: "0 14px"
    height: "40px"
  jump-field:
    backgroundColor: "{colors.black}"
    textColor: "{colors.ink}"
    typography: "{typography.jump}"
    rounded: "{rounded.md}"
    padding: "0 22px"
    height: "76px"
  input:
    backgroundColor: "{colors.black}"
    textColor: "{colors.ink}"
    typography: "{typography.input}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "48px"
  tag:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.tag}"
    rounded: "{rounded.inner-min}"
    padding: "0 8px"
    height: "22px"
  tag-lit:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.primary}"
    typography: "{typography.tag}"
  rail-item:
    textColor: "{colors.ink-faint}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "38px"
  rail-item-active:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.primary}"
  list-row:
    textColor: "{colors.ink-muted}"
    typography: "{typography.item}"
    rounded: "{rounded.row}"
    padding: "8px 12px"
    height: "64px"
  list-row-active:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.primary}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.tile}"
    padding: "0 14px"
    height: "40px"
  popover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pop}"
    padding: "6px"
  dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    width: "460px"
  save-bar:
    backgroundColor: "{colors.black}"
    textColor: "{colors.ink-muted}"
    padding: "12px 40px"
  table-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.caption}"
    height: "44px"
---

# Design System: BrickBot CMS

## Overview

**Creative North Star: "Arena Lights", the working view**

cms.brickbot.ro inherits Arena Lights, the system recorded in `apps/website/DESIGN.md` (detail in `apps/website/.impeccable/design-full.md`) and extended by `apps/auth/DESIGN.md`. Same black ground, same exact brand yellow, same warm-white ink and its two muted steps, same two boards, same one-family Anek Latin worked across its width axis, same squircles, same alarm colour for errors. This file records what the CMS ships and what it adds; where it is silent, auth and then the website govern.

The CMS is the club's control room, calmer and denser than anything public. There are no photos, no LED strips and no arc: the spectacle is a single lit object, the **jump field**, a yellow-outlined field that reaches any module or item in one move, inline on home and as an overlay from every screen. Everything else is quiet: a thin icon rail, black work areas, boards only where something floats or groups. Yellow marks what is live, current, focused or the one thing to do next; the header row has exactly one solid yellow, Publish.

People appear only as email addresses, with a two-letter tile derived from the address. Errors use alarm and nothing else does.

**The Email Only Rule.** An owner rule: accounts carry only an email. Wherever a person appears (activity, last editor, audit log, users, the account menu) they are shown by email, the current member as "You", and their tile's initials come from the address. Nothing greets or labels anyone by name, and there are no avatars.

**Key Characteristics:**
- One lit jump field (76px, yellow 1.5px outline, soft yellow underglow) as the signature, reachable everywhere with ⌘K / Ctrl+K or "/".
- A 68px icon rail that widens to a 240px labelled sidebar on demand; the choice is remembered.
- A shell-drawn header row on every module: name, sub line, the page's ghost actions, a divider, then the publish status and the one yellow Publish button.
- Master-detail editing: a 380px list beside the editor, EN | RO side by side, a sticky opaque save bar at the editor's foot.
- Concentric corners everywhere: an inner radius is derived from its container's radius and padding.
- Status lamps: solid lit yellow, yellow ring, or faint grey solid.
- Alarm only on errors.

## Colors

The inherited palette, applied with a control-room restraint: black work areas, boards for floating and grouped things, yellow for state and the next action.

### Primary
- **Floodlight Yellow** (`primary`): Publish, the jump field's outline and its result icons and arrows, focus rings, the active rail icon, the active list row's name, the active tab, a hovered initials tile (fill) and resting initials (text), lit tags, status lamps, progress bars, the caret and text selection. Always at full value; black text on any yellow fill.
- **Spark White** (`spark`): declared in the theme for parity; the CMS paints nothing with it.

### State
- **Alarm** (`alarm`): errors only. Invalid field strokes and their rings, field error messages, the error notice border, the save bar's error line, and the failed publish status ("Publish failed"). Its "Try again" link stays yellow.

### Neutral
- **Venue Black** (`black`): the page, the rail, the top bar, the nav sheet, inputs, the jump field, the data table body, and the save bar (opaque, so the form never shows through it).
- **Board** (`surface`): hover fills (rows, rail items, chips at rest), popovers, the jump results list, dialogs, repeater items, the segmented control's track, sticky table headers, the slug prefix.
- **Raised Board** (`surface-raised`): the current item (active rail icon, current list row, current tab, selected result), tags, initials tiles, hovered popover options, notices and callouts, the disabled primary button.
- **House Light** (`ink`): titles, item names, input text, emphasised words (emails, item names) inside sentences.
- **Dimmed House Light** (`ink-muted`): running text in rows and dialogs, field labels, rail labels, sub lines.
- **Faint House Light** (`ink-faint`): placeholders, hints, counts, times, captions, table headers, resting rail icons, neutral tag text, the idle status lamp.
- **Hairline** (`rule`): dividers (rail edge, list edge, save bar top, header divider, table rows, section breaks).
- **Field Line** (`line`): the resting stroke of inputs, the tag picker and the rich-text surface; the 1px border of popovers and dialogs.
- **Ghost Line** (`ghost-line`): the 1.5px stroke of ghost buttons.
- **Scrim** (`scrim`): behind the jump overlay; dialogs use the same black at 0.74.
- **Scrollbar** (`scrollbar`): the thumb on the black track.

### Named Rules
**The Exact Yellow Rule.** Inherited, and an owner rule: the primary is #FFEC17 at full value, never tinted, shifted or mixed into a second yellow. Its glows are light around a full-value element, never a paler fill.

**The One Solid Yellow Rule.** In the header row Publish is the only solid yellow; a page's own actions (New, Invite, Upload) render as ghost buttons there even when the page marks them primary. Below the header, the save bar's Save is the one primary of an editor, and it turns raised-board grey while there is nothing to save.

**The Alarm Is Only An Error Rule.** Alarm marks a failure and nothing else: no alarm fills, buttons, headings or decoration, and never on a screen with no error.

## Typography

**Display Font:** Anek Latin (self-hosted woff2, `font-display: optional`, with the website's metric-matched Arial fallback)
**Body Font:** Anek Latin
**Label/Mono Font:** Anek Latin Condensed (width axis 78 to 80)

**Character:** One face ranked by width as much as size. Expanded 800 for every title, a slightly widened 700 for item names and buttons, regular for reading, Condensed caps for anything that captions or classifies.

### Hierarchy
- **Display** (800, 2.7rem, 1, width 116): the home greeting ("Where to?"); 2.1rem on phones.
- **Headline** (800, 2rem, 1.05, width 116): the open item's title in the editor; 1.7rem on phones.
- **Page title** (800, 1.7rem, 1, width 116): the module name in the header row; 1.5rem on phones.
- **Title** (800, 1.6rem, 1.1, width 114): home section heads ("Lately on the team"). Dialog titles sit at 1.4rem width 112; empty-state titles at 1.3 to 1.5rem width 112.
- **Section title** (800, 1.25rem, 1.15, width 112): editor sections ("Basics").
- **Jump** (400, 1.4rem): the jump field's text; 1.2rem in the overlay, 1.1rem on phones.
- **Body** (400, 1rem, 1.45): running text. Inputs use **Input** (1.05rem). Hints 0.95rem, counts and times 0.88 to 0.92rem.
- **Item** (700, 1.02rem, width 106): list row names, table links, result labels, emails in sentences.
- **Button** (700, 1.05rem, width 112): every button; 0.98rem on small buttons.
- **Label** (700, 0.86rem, 0.12em, width 78, uppercase): field labels and repeater numbers.
- **Caption** (700, 0.78rem, 0.14em, width 78, uppercase): group captions over lists (Today, Yesterday; the rail's Website, Links, Library, Admin; result groups), table headers. List-row meta lines use 0.76rem at 0.1em.
- **Tag** (700, 0.74rem, 0.14em, width 78, uppercase): the Tag component, including the EN and RO language tags.

### Named Rules
**The Width Is Hierarchy Rule.** Inherited: Expanded for titles and buttons, 100 for reading, Condensed for labels, captions and tags.

**The Caption Sits Over Its Data Rule.** Condensed caps caption the field, list or column under them. They never sit above a title as a kicker.

## Layout

**Desktop shell.** A two-column grid: the rail (68px, or 240px when open; the width animates over 0.2s) and the main area. The rail is sticky at full height: the logo mark (38px; open, it is followed by the wordmark at 118px nudged `translate: 0 -13.8%`), the module icons in groups (website modules; a separator; Linktree, Short URLs; Media library), then at its foot the Admin icons, the expand toggle and the account tile. Collapsed, groups are split by 24px hairline separators and each icon has a tooltip; open, Condensed group captions replace the separators. The rail's list scrolls with a 20px fade at its foot.

**Header row.** Every module page opens with the shell-drawn header row, at least 92px tall, padded 16px 40px: module name and sub line at left; the page's own actions; a hairline divider with 24px of space; then the publish status and Publish. Pages never draw their own title. When the main area is narrower than 920px the status drops its time.

**Home.** A centred 880px column, 36px from the header: the greeting, the jump field 26px below, module chips 16px below that, then "Lately on the team" 46px further down with rows grouped by day.

**Master-detail.** From 1100px a 380px list column (sticky, scrolling on its own) beside the editor, separated by a hairline. The editor's content is at most 820px (1180px for the blog's two-body editor), with 40px gutters. Under 1100px the list and the editor are separate screens on the same routes, and the editor gains a back link. Fields sit 28px apart; label, input, hint and error 8px apart within a field; editor sections are split by a hairline with 30px above the next section title.

**Tables.** Table pages pad 12px 40px 72px; tools (search, filters) sit above the table. Every data table (Users, Audit log, Short URLs, Seasons events and awards) stacks into one card per row when its box is under 760px.

**Phones (under 900px).** A sticky 60px top bar replaces the rail: logo mark, search (opens the jump overlay), Publish, and a menu button. The publish status moves to a strip under the bar that wraps rather than truncates; the "Sample data" Tag sits right-aligned, on its own row when the status fills the width. The menu opens a full-screen nav sheet: grouped links (48px rows), the publish status, and the account at its foot. Gutters drop to 16px, the jump field to 60px and its key hints hide. An open editor hides the header row: the back link and the item's actions (as 44px icon buttons) share one row, then the title and the last-edited line. The save bar becomes a two-column grid (status, buttons). Works from 320px.

## Elevation & Depth

Flat black, as in the rest of the family. Depth comes from the two boards and from light. Shadows appear only on things that float over the page (popovers, the results list, dialogs) and as yellow light around a lit element.

### Shadow Vocabulary
- **Floodlight glow** (`box-shadow: 0 10px 30px -12px rgb(255 236 23 / 0.6)`, hover `0 12px 34px -10px rgb(255 236 23 / 0.8)`): primary buttons, lit at rest as in auth.
- **Jump glow** (`box-shadow: 0 18px 50px -24px rgb(255 236 23 / 0.45)`; focused, `0 0 0 1px` yellow plus `0 18px 50px -20px rgb(255 236 23 / 0.6)`): the jump field.
- **Float shadow** (`box-shadow: 0 24px 60px -20px rgb(0 0 0 / 0.85)`): popovers, the jump results list, the tag picker list, the toolbar menu. Dialogs use `0 30px 80px -20px #000`.
- **Lamp glow** (`box-shadow: 0 0 6px` yellow): a lit status lamp.
- **Focus outline** (`outline: 2px solid` yellow, 3px offset; 4px on buttons): global. Fields instead turn their stroke yellow and add a 1px yellow ring.

### Named Rules
**The Boards Not Cards Rule.** Containers are flat boards (`surface`, `surface-raised`) or hairline-bordered black; a drop shadow means the thing floats above the page.

## Shapes

Squircles, as everywhere in the family. Where `corner-shape: squircle` is supported every element takes it and the radii grow (button 22px, small 18px, medium 24px, tile 16px, row 18px, popover 24px); elsewhere the plain fallbacks apply (12 / 10 / 12 / 10 / 12 / 12px). Circles stay round: status lamps, spinners, progress bars, the toggle. Strokes are 1.5px on interactive outlines, 1px on hairlines and floating containers.

### Concentric corners
A container declares its own radius (`--ro`) and its inset (`--pad`, padding plus border). Every rounded child inside it takes **inner = max(outer − k × pad, k × 4px)** (`--ri`), with **k = 1** for plain radii and **k = 2** under squircle, since a squircle runs about twice a circular arc. A child nested deeper sets its own `--pad`. Applied to: popover options and the Publish popover's button, jump results, the segmented control, initials tiles in activity rows and the open account row, tag-picker chips, repeater inputs and buttons, dialog buttons, stacked-table action buttons, rich-text toolbar buttons. The minimum (k × 4px) is also the Tag's radius.

### Named Rules
**The Concentric Corner Rule.** An owner rule: a rounded element inside a rounded container is concentric with it. Never give a nested element the same radius as its parent; derive it.

## Components

### Jump field and palette (signature)
- **Field:** 76px, black, 1.5px yellow outline, medium squircle, 0 22px padding, a 26px search icon (ink-muted, yellow on focus), the Jump type, placeholder "Jump to a module, post, sponsor, season…", and ⌘ K key hints at the right (hidden on touch devices and phones). Jump glow at rest; focused, it gains a 1px yellow ring.
- **Results:** a Board list under the field (8px gap, 6px padding, 1px `line` border, float shadow), grouped Modules / Items / Actions under Condensed captions. Each option is 48px: yellow icon, Item-type label, faint hint at the right, and a yellow arrow that appears on the selected row; the selected row fills with Raised Board. Arrow keys move, Enter opens.
- **Overlay:** ⌘K / Ctrl+K or "/" from any screen opens the same component in a 680px panel 12vh from the top, over the scrim; the field is 64px and ringed. It rises 8px and fades in over 180ms. On home the field is inline.

### Icon rail
- **Items:** 38px rows (34px when open), small squircle, icon in ink-faint. Hover fills Board and lifts the icon to ink. The current module is Raised Board with a yellow icon and an ink label.
- **Expanded state:** the toggle at the rail's foot widens it to 240px, showing labels (700, width 104, ink-muted) and group captions, and adds the wordmark; the choice is remembered.
- **Tooltip:** collapsed only, to the right of the icon: Raised Board, 1px `line` border, Condensed caps 0.82rem, rising in over 140ms.
- **Account:** a 38px initials tile (Raised Board, yellow letters, Expanded 800), filled yellow with black letters on hover or when its menu is open. Open, it becomes a row with the email beside the tile, which nests concentrically in it. Its menu is a popover showing the email.

### Header row and Publish
- **Status:** a lamp then a short phrase: "Live · published yesterday 18:42", "4 changes waiting · live since…", "Building… 0:12", or "Publish failed · Try again" in alarm.
- **Lamps (8px circles):** solid yellow with lamp glow = live; a 2px yellow ring = saved changes waiting to publish; solid ink-faint = saved and idle; pulsing yellow = building. The Users table reuses the grammar: active solid, invited ring, deactivated faint.
- **Publish:** the yellow primary at 44px (40px in the top bar) with a bolt icon. It opens a 320px popover to choose Website and/or Links, each with its change count, and a full-width primary to go.

### Buttons
- **Shape:** squircle (22px; 12px fallback), 44px tall, 0 20px padding, Button type. Small: 40px, 0 14px.
- **Primary:** yellow, black text, Floodlight glow. Disabled: Raised Board fill, faint text, no glow. Active presses 1px.
- **Ghost:** transparent, 1.5px `ghost-line` stroke, ink text; hover turns stroke and text yellow.
- **Icon button:** 44px (40px small) square, small squircle, ink-muted; hover yellow on Board.
- **Link:** yellow 700 width 110, 1.5px underline 0.32em below. Row actions in tables use the link style in ink-muted, yellow on hover.

### Tag
- **Neutral:** 22px tall, Raised Board, a 1px inset `rule` hairline, faint Condensed caps, radius k × 4px. Module names in activity rows, "Markdown" beside a label, EN / RO language tags, permission names.
- **Lit:** yellow text and a 1px inset yellow hairline. A tag is never filled yellow.

### Inputs / Fields
- **Style:** 48px (40px small), black, 1.5px `line` stroke, small squircle, 0 14px padding, Input type; label above in the Label style, optional marker in regular faint.
- **Hover / Focus:** stroke to ink-faint; focused, yellow stroke plus 1px yellow ring and a yellow caret.
- **Missing translation:** a dashed ink-faint stroke until filled.
- **Error:** alarm stroke (alarm ring on focus) and an alarm message under the field.
- **Bilingual field:** one label, then EN and RO columns side by side (14px gap), each headed by its Condensed language tag; they stack under a 560px container. Character counts sit under each column.
- **Variants:** textarea that grows with its text; select with a drawn chevron; search with an inset icon; slug with a Board prefix joined to the input; number with a unit; date; toggle (a 52 × 30px pill whose track fills yellow with a black knob when on); tag picker (a field holding Raised Board chips with a remove button, and a Board option list).

### List → editor
- **List column:** search, then filters (Condensed captions over selects), a count, and rows. A row is 64px: a 44px thumbnail, the name in Item type, a Condensed meta line (slug, status). Hover Board; the current row is Raised Board with its name yellow. Empty states give a short title and a ghost "New".
- **Editor:** back link (under 1100px), the item title in Headline, "Last edited by **email** · date", the item's actions as ghost buttons, then sections of fields.
- **Save bar:** sticky at the editor's foot, opaque black with a hairline above. At left a lamp and the state ("All changes saved", "Unsaved changes", "Saving…"), any missing-translation note, and an alarm error line; at right Save (⌘S / Ctrl+S). The list → editor swap fades in over 200ms.

### Data table
Black body inside a 1px `rule` border with a medium squircle; a sticky Board header row (44px, Caption type, sortable columns with a yellow arrow when sorted); 12px 16px cells divided by hairlines; whole-row links that turn yellow on hover; Board hover, Raised Board for the current row. Under a 760px box it stacks into cards with Condensed captions per cell, and their action buttons nest concentrically.

### Dialogs
A 460px (640px wide) Board panel over a black 0.74 scrim, 1px `line` border, medium squircle, dialog shadow; title in Expanded 800 1.4rem, body in ink-muted, actions right-aligned, buttons nested concentrically. It rises 8px over 200ms; the scrim fades over 160ms. Actions share the width under 520px.

### Repeaters
Each item is a Board panel (6px 16px 18px padding) with a bar holding its Condensed number and move / remove icon buttons; inputs and buttons inside take the concentric inner radius. "Add" sits after the list.

### File field and media picker
A 96px (64px compact) preview tile with a hairline border, on Raised Board for light artwork or House Light for dark artwork, beside the stored key and a ghost "Choose from media library" with a Remove link. The media picker is a wide dialog with a grid of square tiles (min 112px) and names; the chosen tile gets a 2px yellow outline 2px off and a yellow name.

### Home chips and segmented control
Module chips: 40px, tile radius, Board fill, ink-muted text, a yellow icon; hover Raised Board. The "All modules" chip is outlined instead. The Everyone / Just me switch is a Board track (3px padding) whose checked option is Raised Board in ink.

The blog editor's EN / RO body switch, shown only while its box is under 780px (wider, both bodies sit side by side), follows the same selected state: a black track with a 1px `line` border and 4px padding, 40px options in Expanded 700, ink-muted at rest and yellow on hover, the selected option Raised Board in ink with the concentric inner radius. A selected segment is never filled yellow.

### Activity rows
54px rows: a 36px initials tile (from the email), "**email** action **item**" (the current member as "You"), a module Tag, the time, and an arrow. Hover fills Board, lights the tile yellow and shows the arrow. Grouped under day captions.

### Motion
Ease `cubic-bezier(0.16, 1, 0.3, 1)`. The palette, popovers and the nav sheet rise 8px and fade in over 180ms; dialogs over 200ms; tooltips over 140ms. List → editor swaps fade over 200ms. The rail width animates over 200ms. Hovers change colour over 200 to 250ms. Skeletons shimmer over 1.6s; the building lamp pulses every second. Reduced motion makes all of it instant.

## Do's and Don'ts

### Do:
- **Do** use #FFEC17 at full value for every lit element, with black text on any yellow fill.
- **Do** keep Publish the only solid yellow in the header row; render the page's own actions as ghost buttons.
- **Do** show every person by email, the current member as "You", and derive initials tiles from the email.
- **Do** derive every nested radius from its container: inner = max(outer − k × pad, k × 4px), k = 2 under squircle.
- **Do** edit translatable fields as EN | RO side by side, each column headed by its Condensed language tag, with a dashed stroke on a missing translation.
- **Do** keep the save bar sticky and opaque at the editor's foot, with the state in words beside a lamp.
- **Do** use the lamp grammar for state: solid lit, yellow ring, faint solid.
- **Do** use alarm only where something failed.

### Don't:
- **Don't** tint, lighten, darken or mix the primary yellow.
- **Don't** greet or label anyone by name; there are no display names or avatars.
- **Don't** fill a Tag with yellow; lit tags are yellow text on a yellow hairline.
- **Don't** put a second solid yellow button in the header row.
- **Don't** give a nested element the same radius as its container.
- **Don't** add stat tiles or a dashboard to home; it is a jump field and recent activity.
- **Don't** put a Condensed caption above a title as a kicker.
- **Don't** use alarm for decoration, headings, fills or anything that is not an error.
