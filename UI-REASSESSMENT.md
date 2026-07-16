# UI reassessment — 2026-07-16

Full-app pass against `PRODUCT.md`'s foolproof/mom-test bar, using Impeccable's bundled detector (deterministic, `src/index.js` full scan) plus a markup-level heuristic/cognitive-load/persona review (Nielsen's 10, Jordan/Sam/Casey personas) across real server-rendered HTML for the daily-driver surfaces. **Pixel-level browser verification could not run this session** — the Chrome extension can't reach this sandbox's localhost (confirmed against both a python static-file server and the always-on `wrangler dev` server on 8788; not a server problem, a network-isolation mismatch between where these tools run and where the real browser lives). Everything below is verified from real rendered HTML/CSS and the deterministic detector, not assumed — but a follow-up visual pass in an environment where the browser can actually reach the dev server is still owed before calling any visual fix "done", per this repo's own standing rule.

## Detector results (`impeccable`'s bundled `detect.mjs`, full scan of `src/index.js`)

21 findings, 3 warning + 18 advisory. All reviewed individually, not just counted:

- **3 `broken-image` warnings — all false positives, verified by reading the exact lines.** Two are matches inside code *comments* discussing `<img>` tags (lines 1550, 2934), not real markup. One (line 2551) is a real `<img id="teacher-photo-preview">` but it's an intentionally-empty, `display:none` client-side preview element that JS fills on file select — correct as-is.
- **18 `design-system-color`/`design-system-radius` advisories** — expected drift, since `DESIGN.md` was just authored this session from a representative token subset. These are legitimate existing colors/radii that should be *added* to `DESIGN.md` as documented tokens, not bugs: WhatsApp brand green `#25D366` (correct — matches platform convention for the WhatsApp button), a muted-gray variant `#8A93A6`, an alt success green `#1F9D55`, and radii `6px`/`12px`/`22px` used contextually (small tile corners, printable-card corners, the estamara card). **Action:** fold these into `DESIGN.md`'s color/rounded tables rather than "fixing" working code.

## Real findings (prioritized)

### P1 — `/register`'s subject picker is a flat 29-item checkbox wall
Confirmed in the raw rendered HTML: all subject checkboxes render as one unbroken `.subjects-grid` block with **zero sub-grouping** between them — no category headers, no chunking. Impeccable's own cognitive-load checklist puts 8+ simultaneous options at "overloaded: users will skip, misclick, or abandon" — this is nearly 4x that. Fails the mom test directly: a first-time parent/student has to scan the entire wall to find their subject. **Fix:** group under a few category headers (e.g. by the already-selected track, or common subject clusters) — the teacher-picker just below it already does exactly this correctly (`teacher-subject-block` per subject, revealed progressively), so the pattern to copy already exists two sections down on the same page.

### P2 — Missing `autocomplete` attributes on identity/contact fields
`/register`, `/admin/staff` (add staff), `/admin/teachers/new` all have name/email/phone text inputs with no `autocomplete` hint (confirmed: 1 occurrence total across all three forms, vs. ~10+ name/email/phone fields). This was already flagged once before (the guide-redesign checkpoint's `ui-craft-detect` baseline run, 2026-07-15) and never fixed. Real cost for the mom test: no autofill assist on a phone keyboard, more typing, more chance of a typo'd phone number (which matters here — phone numbers gate WhatsApp delivery and fraud-prevention parent-visibility). **Fix:** `autocomplete="name"` / `"tel"` / `"email"` on the matching fields — a few minutes, zero behavior risk.

### P3 — Local dev D1 has one corrupted-encoding test teacher record
Teacher id `tjsx7xqrf` (subject: math) has `name = "?. ????? ???"` — literal mangled bytes, not a display artifact (confirmed via a direct `wrangler d1 execute --local` query, not just eyeballing rendered HTML). Matches this repo's own documented pitfall exactly ("never generate Arabic via shell echo/curl — encoding corrupts") — almost certainly test data created via a raw `curl -F` during a past session rather than the app's real UI. **Local-only, not a production bug** (production D1 wasn't touched) and **not a code defect** — the app didn't corrupt it, whatever created it fed it already-corrupted bytes. Flagging for hygiene: delete this row before it pollutes any future local verification pass; not worth a code fix since the real POST path (via a real browser form) doesn't have this failure mode.

### Confirmed working well (per the mom test) — not findings, worth stating so nothing gets "fixed" that isn't broken
- RTL (`dir="rtl"`) correct on every checked surface.
- `/admin/intake` already uses native `<details>`/`<summary>` progressive disclosure (3 collapsible panels) — the exact fix for cognitive overload, already shipped (2026-07-14 playbook row).
- `/register`'s teacher-picker is properly chunked per-subject and progressively revealed — a real, already-correct pattern (the P1 fix above should copy it, not invent a new one).
- `/admin/teachers` groups by subject under real `<h2>` headings (needs-attention section + per-subject groups) — already shipped, already correct.
- Nav stays at 3-4 top-level items, role-gated by omission (not disabled/grayed) — matches "recognition over recall" and the ≤5-nav-item guideline.

## Owner/finance surfaces (light pass, per plan)
`/admin/owner`, `/admin/ledger`, `/admin/staff`, teacher settlement — markup-level pass only (no deep critique, per plan scope). No missing labels, no orphaned inputs beyond the same `autocomplete` gap noted above (P2 covers these too — `/admin/staff`'s add form is one of the three affected forms).

## Direction fork check (for the optional `/council`)
No genuine directional fork surfaced. The IA (owner/clerk split, task-first intake/session/owner routing) was already settled by a real `/council` round on 2026-07-13 and hasn't drifted. Skipping the optional council — nothing here rises to a real disagreement-worthy decision, just concrete, narrow fixes.

## What this backlog does NOT cover yet
Pixel-level visual QA (contrast measured on real rendered pixels, actual tap-target hit-testing, real print-preview of the guide's SVGs) — blocked on the browser-access gap noted above. Recommend closing that gap (or doing a manual pass on your own machine) before the final "done" verification on Phase 2/9's `wrangler dev` browser check.
