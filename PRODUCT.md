# Product

## Register

product

## Users

Two groups, both non-technical:

- **Front-desk/clerk staff** — 50+, Arabic-first, on shared phones/tablets/a USB kiosk scanner. Tech literacy caps at Facebook and YouTube. Mid-shift, often mid-conversation with a walk-in parent or student — no time to read.
- **Owner** (Hazem's father, who runs the business) — same tech-literacy ceiling, needs to self-navigate money/staff/teacher management without asking for help.

Context of use: a real front desk, phone in one hand, a person waiting. Every screen is used cold, without training, against the printed `/admin/guide` as the only fallback.

## Product Purpose

A self-hosted attendance, registration, payments, and scheduling system for Harv Education Center (Cairo, thanawiya amma / baccalaureate prep). Replaces a retired desktop app (CenterStudent/Access) and paper процесses: student registration → teacher/group booking → QR-based attendance scanning → payment/ledger tracking → teacher payout settlement. Success = a cold, untrained staff member completes any task (register a student, take a payment, mark attendance, check who owes money) without hesitation or asking someone else.

## Brand Personality

**Fast, no-nonsense, efficient.** Built for a busy front-desk clerk mid-rush: minimal taps, big obvious targets, speed and clarity over politeness or decoration. Distinct from Harv's outward marketing voice (warm, motivational, student-facing) — this is the back-office tool, and it should feel like one: a clinic intake form, not a landing page. One clear action per screen, plain Arabic labels, no jargon, nothing clever.

## Anti-references

- Not a SaaS dashboard (no gradient stat tiles, no chart-heavy analytics-for-analytics'-sake, no "insights" framing).
- Not a marketing/landing surface — no hero sections, no persuasive copy, no Harv's promotional tone.
- Not "clever" UI patterns that require learning (no swipe gestures, no hidden menus, no icon-only actions without a label the first time).
- Not dense/technical admin-panel aesthetics (no dense data-grid-as-default, no keyboard-shortcut-first affordances) — the audience has never used one.

## Design Principles

1. **One primary action per screen.** If a screen has two competing calls to action, it's not done — the mom test fails on ambiguity, not complexity.
2. **Task-first, not feature-first navigation.** Organize by "what do you want to do" (register a student, take a payment, check who's here) not by data model (students / bookings / payments as separate abstract sections).
3. **Recognition over recall.** Icon + plain-Arabic label together, always — never icon alone, never a term the user has to remember from elsewhere in the app.
4. **Real content over lorem/placeholder thinking.** Every state (empty, error, success) is designed in plain Arabic sentences a clerk would actually read, not a generic "no data" label.
5. **Print is a first-class fallback**, not an afterthought — the physical paper kill-switch (`/admin/print`) and the printable guide are load-bearing for a low-tech, sometimes-offline environment.

## Accessibility & Inclusion

RTL Arabic throughout (existing, load-bearing — don't regress). WCAG AA baseline: contrast ≥4.5:1 body text, ≥3:1 large text, tap targets ≥44px, visible focus states. No elevated bar beyond AA requested — the existing CLAUDE.md conventions (Cairo font, RTL, sentence-case Arabic labels) already carry the accessibility weight for this audience; the leverage point is task clarity and copy, not assistive-tech edge cases.
