---
name: harv-attendance
description: Front-desk operations tool for Harv Education Center — attendance, registration, payments, scheduling
colors:
  brand-red: "#D42027"
  ink-navy: "#1A2744"
  paper: "#FAFAF8"
  surface: "#FFFFFF"
  line: "#E5E7EB"
  line-soft: "#F3F4F6"
  success: "#1F9D6B"
  success-bg: "#E2F5EC"
  red-pressed: "#B91C1C"
  muted-text: "#5A6784"
  pending-tint: "#FFF5F5"
  promo-tint: "#FFF8E1"
  promo-border: "#F0C929"
  mode-online-bg: "#E3F2FD"
  mode-online-text: "#1565C0"
  mode-both-bg: "#F3E8FF"
  mode-both-text: "#7C3AED"
typography:
  body:
    fontFamily: "'Cairo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.5
  h1:
    fontFamily: "'Cairo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
  cardTitle:
    fontFamily: "'Cairo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
  label:
    fontFamily: "'Cairo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
  small:
    fontFamily: "'Cairo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
rounded:
  pill: "999px"
  lg: "16px"
  md: "14px"
  sm: "10px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand-red}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "16px"
  button-primary-active:
    backgroundColor: "{colors.red-pressed}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
    padding: "16px"
  button-secondary-reject:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.brand-red}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
  nav-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.pill}"
    padding: "14px 20px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "16px"
  input-field:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink-navy}"
    rounded: "{rounded.sm}"
    padding: "14px 16px"
---

# Design System: harv-attendance

## 1. Overview

**Creative North Star: "The Front-Desk Counter"**

Flat white cards laid out on a warm paper-white background, one big red action button per screen, oversized pill navigation you can hit without aiming carefully. The metaphor is a physical intake counter at a real clinic or government office: everything is out in the open, nothing is hidden behind a menu, and there is always exactly one thing in front of you to sign, tap, or hand over. This is the back-office counterpart to Harv's outward marketing brand — same red/navy/Cairo identity, but stripped of persuasion. Nobody here needs to be sold on anything; they need to finish the task in front of them and get back to the person waiting.

The system explicitly rejects SaaS-dashboard visual language (no gradient stat tiles, no chart-heavy "insights" framing), landing-page persuasion (no hero sections, no promotional copy), and cleverness that has to be learned (no swipe gestures, no icon-only buttons, no hidden menus). It also rejects dense technical admin-panel conventions — no data-grid-as-default, no keyboard-shortcut affordances — because the audience has never used one and never will need to.

**Two speeds, by task, not by screen family.** Confirmed directly with the app's owner: surfaces used *in the moment* under time pressure (scanning, marking attendance, the counter kiosk) get the loudest, biggest, most unmissable version of every component. Surfaces used *deliberately, ahead of time* (scheduling the week, editing a teacher, reviewing the ledger) can afford a calmer, more tactile-and-confident register — still large-target and plain-language, just less shouty. Same token set throughout; the dial that moves is button/tile size and visual weight, not color or shape family.

**Key Characteristics:**
- Flat surfaces, soft shadows only where physically necessary (the floating help button, the print ticket)
- One saturated color (`--red`) reserved for the single primary action per screen — everything else is ink, paper, or line-gray
- Pill shape (`border-radius:999px`) as the universal "tappable" signal — buttons, nav links, badges, chips all share it
- RTL Arabic-first layout; every label is a plain sentence a first-time reader understands, never an icon alone
- Big-by-default form controls (18px+ font, 14px+ padding) — there is no compact/dense mode anywhere in this system, by design

## 2. Colors

Deliberately narrow: two brand anchors (red, navy), a warm-white paper background, and functional grays. Color is never decorative — every non-neutral hue on screen means something (a status, a role, an alert).

### Primary
- **Harv Red** (#D42027): the single primary-action color. Every screen's one primary button, the header's bottom border, focus rings, and any "this needs attention" signal (pending badges, error text, conflict warnings). Its scarcity is the point — if more than one thing on a screen is red, the screen has more than one primary action and needs to be redesigned, not the color re-applied.
- **Red Pressed** (#B91C1C): the `:active` state for the primary button — the only state-shift the red family gets.

### Secondary
- **Ink Navy** (#1A2744): all body text, headings, and the "serious/owner" surfaces (the teacher-reference panel border, dashboard card borders). Reads as authority/trust without competing with red for attention.

### Neutral
- **Paper** (#FAFAF8): the page background — warm off-white, matches Harv's committed marketing-brand paper token, not a generic AI near-white (this is inherited brand identity, not a fresh choice).
- **Surface White** (#FFFFFF): cards, forms, inputs — one step lighter than paper so containers read as physically raised off the page.
- **Line** (#E5E7EB) / **Line Soft** (#F3F4F6): borders and dividers. Line is the default 2px border weight everywhere; Line Soft is for quiet fill (badge backgrounds, empty photo placeholders).
- **Muted Text** (#5A6784): the only gray permitted for text, and only for secondary/small text (card subtitles, hints, timestamps) — never for anything a user must read to complete a task. Confirmed to clear WCAG AA at the sizes it's used.

### Functional roles
- **Success** (#1F9D6B) / **Success BG** (#E2F5EC): the confirmation screen after a scan/registration, "paid" badges.
- **Pending tint** (#FFF5F5): pending-student cards, selected-teacher-pick highlight — a pale red wash, not the solid red.
- **Promo tint** (#FFF8E1) + border (#F0C929): promotional offers shown during registration — the one place a third color (amber) appears, scoped tightly to "this is a special offer," never reused elsewhere.
- **Mode badges** (online #1565C0/#E3F2FD, center = success green, both = violet #7C3AED/#F3E8FF): small, scoped status chips only — never body color.

### Named Rules
**The One Red Rule.** Exactly one primary red button per screen. If a second action needs weight, it gets a white/outlined red "reject" or "secondary" treatment (`.btn-reject`), never a second solid red.

**No Decorative Gray.** Gray text (`--line`/muted `#5A6784`) is structural (borders, secondary metadata) or it doesn't exist. Never use gray for anything the user must read to act.

## 3. Typography

**Body Font:** Cairo, with `ui-sans-serif, system-ui, sans-serif` fallback.

**Character:** One typeface, no exceptions (a committed Harv-wide rule, not a per-project choice) — Cairo carries both the marketing brand and this ops tool. Everything is set larger than a typical web-app default (18px body, not 14-16px) because the audience skews older and the surface is a phone in a busy hand, not a desk monitor.

### Hierarchy
- **H1** (700, 26px, line-height 1.2): page title, one per screen, always the first thing read.
- **Card title** (700, 19px): a card's name/identity line (a student's name, a teacher's name).
- **Label** (600, 16px): form field labels — always visible above the field, never a placeholder-only label.
- **Body** (400, 18px, line-height 1.5): everything else — the size floor for anything a user must read to act.
- **Small/meta** (400, 14px, color `--muted-text` #5A6784): timestamps, hints, secondary card text only.

### Named Rules
**The No-Placeholder-Only-Label Rule.** A field's purpose is never conveyed by placeholder text alone — every input has a real, always-visible `<label>`. Placeholder text (when used) still meets the 4.5:1 contrast floor.

## 4. Elevation

Flat by default. Depth is conveyed by a 1-2px border (`--line`) and a background-color step (paper → surface white), not shadows. The two exceptions are real physical/interaction cues, not decoration: the floating help button (`box-shadow:0 4px 14px rgba(0,0,0,.25)`, signaling "this floats above the page, tap it from anywhere") and the printable QR/estamara ticket (`0 10px 34px rgba(26,39,68,.10)`, a soft ambient lift that reads as "this is a physical card").

### Shadow Vocabulary
- **Floating action** (`box-shadow:0 4px 14px rgba(0,0,0,.25)`): the persistent `?` help FAB — the one element that must read as "above" everything else.
- **Ambient card lift** (`box-shadow:0 10px 34px rgba(26,39,68,.10)`): the student ID/estamara card — soft, navy-tinted, signals a physical printed object rather than a UI panel.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. A shadow appears only when an element is meant to feel physically separate from the page (floating, printed) — never as a generic "card" decoration.

## 5. Components

**The Two-Speed Rule** (confirmed with the app owner) governs every component below: **speed-critical surfaces** (scanning, marking attendance, the counter kiosk) get the loudest/biggest version — full-width, high-contrast, zero ambiguity. **Deliberate surfaces** (scheduling, teacher/staff management, the ledger) can use the calmer "tactile and confident" register — same shapes and colors, slightly less visual shouting, more room for a hover/focus micro-state since there's no time pressure. Never the reverse — a speed surface must never be quieter than a deliberate one.

### Buttons
- **Shape:** full pill (`border-radius:999px`), always.
- **Primary:** full-width by default (`width:100%`), 16px padding, 19px/700 white text on `--red`; `:active` darkens to `--red-pressed` (#B91C1C) — the only state Cairo/mobile taps reliably render, so it carries the full weight of "this registered."
- **Secondary/Reject:** white background, red border + text (`.btn-reject`) — used for a destructive/negative counterpart to the primary action (e.g. "reject" beside "approve"), never a second solid-red button.
- **Nav pills:** smaller (`14px 20px`), white surface, 2px line border, red border on hover/focus-visible — same pill family as primary buttons so "this is tappable" reads consistently everywhere.

### Cards
- **Corner style:** 14px radius (`--md`) for content cards, 16px (`--lg`) for dashboard/owner-zone cards, 999px for chips/badges.
- **Background:** white surface on paper background; a card never sits directly on another card's surface color (no nested-card stacking).
- **Border:** 1-2px `--line`, upgraded to `--ink` (3px) for owner/authority-weighted panels (the teacher-reference panel, dashboard cards) and to `--red` for anything needing attention (pending student cards, selected/checked picker cards).
- **Internal padding:** 16-20px, generous — never cramped.

### Inputs / Fields
- **Style:** 2px `--line` border, 10px radius, 14-16px padding, 18px font — same visual weight as body text, never smaller.
- **Focus:** border shifts to `--red`, no glow/ring — a clean, unambiguous "you're here now" signal.
- **Full-width by default** (`width:100%`) — no inline/compact inputs anywhere in this system.

### Chips / Pickers
- **Subject/teacher-pick cards:** the whole card is the tap target (`position:relative`, invisible input overlaying the full card), border goes red + pale-red fill + inset red ring when selected — a large, unambiguous "this one's picked" state rather than a small checkbox.
- **Badges** (pending, paid, mode): solid-color pill, 12-13px bold text, used only as a status label riding on a card — never as a standalone interactive element.

### Navigation
- Horizontal wrapping row of pill links (`nav`), 2px border default, red border on hover/focus-visible. Deliberately flat-list, not a dropdown or hamburger menu — every destination is always visible, matching the "nothing hidden" north star. Role-gated links (owner-only) simply don't render for a clerk, rather than rendering disabled/grayed.

### Signature Component: the persistent Help FAB
A fixed-position red circular button (`?`), bottom corner, present on every authenticated page, linking straight to `/admin/guide`. This is the system's answer to "what if the user gets stuck" — always in the same physical spot, never buried in a menu, floating above scroll.

## 6. Do's and Don'ts

Every anti-reference from PRODUCT.md restated here as an enforceable visual rule.

### Do:
- **Do** keep exactly one solid-red primary action per screen (The One Red Rule).
- **Do** use the full pill shape for anything tappable — buttons, nav, chips, badges — so "tappable" has one consistent visual signal across the whole app.
- **Do** set body text at 18px minimum and labels always-visible (never placeholder-only).
- **Do** make speed-critical surfaces (scanning/attendance) louder and bigger than deliberate surfaces (scheduling/ledger) — per The Two-Speed Rule — while keeping the same color/shape vocabulary throughout.
- **Do** keep every navigation destination visible at all times; role-gate by omission, not by disabling.

### Don't:
- **Don't** build a SaaS-style dashboard: no gradient stat tiles, no chart-heavy "insights" framing, no hero-metric template.
- **Don't** use landing-page/marketing patterns here: no hero sections, no persuasive copy, no promotional tone — this is the back office, not the storefront.
- **Don't** ship icon-only actions, swipe gestures, or hidden menus — anything that requires the user to have learned it once already.
- **Don't** use a dense data-grid or keyboard-shortcut-first pattern anywhere — the audience has never used admin software before this.
- **Don't** use gray text for anything the user must read to complete a task — gray is structural (borders, secondary metadata) only.
- **Don't** add a second solid-red element to a screen that already has a primary action — use the white/red-outline secondary treatment instead.
- **Don't** add decorative shadows to ordinary cards — depth comes from border + background-step, not `box-shadow`, except the two named floating/printed exceptions above.
