# Support playbook

Written during development, not after launch — every feature that ships, or bug that gets fixed, gets a row here the same sprint, per the Faction Group 3-tier model (source video: facebook.com/reel/1023018453988059, watched 2026-07-10 — see design-system vault `wiki/log.md` 2026-07-10).

**Standing rule: this file gets updated every time a feature ships or a bug is fixed in this repo — not batched, not deferred.** The point is to know later exactly what was built, what broke, and what fixed it, without having to reconstruct it from commit messages or memory.

## The 3 tiers

1. **Automated resolution** — known issue, documented fix, no human needed.
2. **Assisted triage** — unknown issue, agent gathers context (logs, recent commits, error) and escalates to Hazem *with* that context, not a bare alert.
3. **Incident response** — security or data-integrity issue, human-led, agent's job is to surface it loud and fast.

**Current state (2026-07-10): documentation only.** No log-piping or auto-resolution wired up yet — there are no production users, so there's no real traffic to justify that infra. Revisit tier-1 automation once real usage surfaces real recurring issues (see TO DO.md).

## Build log (what shipped, in order)

| Date | What | Detail |
|---|---|---|
| 2026-07-08 | MVP | Cloudflare Workers + D1 attendance system. Admin roster, `/scan` (open, phone-camera friendly, no login), Cloudflare Access gating on `/admin`. |
| 2026-07-10 | Branding | Harv tokens (#D42027 red, #1A2744 navy, Cairo font, logo as base64 data URI) applied to roster/scan/today pages. UI labels switched to Arabic for the 50+/low-tech staff audience. |
| 2026-07-10 | Access verification | Confirmed Cloudflare Access enforces server-side (unauthenticated curl to `/admin` and `/admin/today` → 302 to Access login), not just app-level — cleared as the one dealbreaker from the `/council` delivery-plan verdict. |
| 2026-07-10 | Attendance dedup | `migrations/0001_attendance_dedup.sql` — `UNIQUE INDEX idx_attendance_student_day ON attendance(student_id, date(scanned_at))`. Stops double-scanning the same student same day from creating duplicate rows. |
| 2026-07-10 | Student-facing page | `/student?id=N` — branded ID-card layout, attendance-status pill, 250px QR, Egyptian-Arabic microcopy, branded 404. Plus `/manifest.json` + `/icon.png` for home-screen installability (no service worker/offline layer — deliberately deferred, see below). |
| 2026-07-10 | Git init + deploy | Repo git-initialized, dedup migration applied to production D1, `wrangler deploy` shipped branding+dedup+student-page live to `harv-attendance.hazemviii.workers.dev`. |
| 2026-07-10 | Student self-registration | `/register` — public form (school/stage/phone/email/optional photo), writes `pending` rows for staff approval via `/admin`. `migrations/0002_student_registration.sql`. |
| 2026-07-10 | Physical kill-switch | `/admin/print` — printable paper roster (subject/teacher/time columns) as an offline fallback per the `/council` verdict. |
| 2026-07-10 | RTL + i18n | Global `dir=rtl` fix across all pages (was logo-left/LTR-leaning before); AR/EN toggle on `/register` and `/admin`; stage values stored canonically in Arabic. |
| 2026-07-10 | Roster readability | Zebra-striped roster and today's-attendance cards. |
| 2026-07-10 | Subjects + payment + teacher-recs | Registration form: 5 grade chips, subject checkboxes (incl. لغات/عربي English-cousin variants: Physics/Chemistry/Math/Accounting), **mandatory parent WhatsApp number that must differ from the student's own** (fraud prevention). `migrations/0003_subjects_payment.sql`, `0004_teachers_promotions.sql`, `0005_parent_phone.sql`. |
| 2026-07-10 | Clerk processing screen | Pre-filled registration + live teacher/schedule recommendation panel (scoped to picked subjects+grade) + active promotions surfaced automatically (e.g. German free course). |
| 2026-07-10 | Payment gating | Payment method (Cash/InstaPay/Vodafone Cash) recorded on approval; `/scan` and `/student` both reject anything not `approved` — an unpaid registration's QR genuinely can't grant entry. |
| 2026-07-10 | Post-payment handoff | Printable QR entry ticket + separate WhatsApp links for student and parent (parent gets independent attendance visibility — same fraud-prevention principle as the phone number). |
| 2026-07-10 | Install-to-home-screen banner | OS-specific instructions on `/student` (iOS manual steps, Android native install prompt). |
| 2026-07-10 | Teacher roster import | `scripts/import-teachers.js` — one-time snapshot from the design-system repo's `data/teachers.json` into this repo's own D1. Manual re-run required when the source roster changes (no auto-sync). |
| 2026-07-10 | Promotions admin | Add/toggle active offers ("ads") shown to clerks during registration processing. |
| 2026-07-10 | AI PR review pipeline | `.github/workflows/ai-review.yml` — `anthropics/claude-code-action@v1`, custom prompt (business logic/security/edge cases/N+1, ignores style), structured `has_critical_issues` output blocks merge. Auth via user's own Claude subscription (`claude setup-token`, OAuth, no separate API billing). |
| 2026-07-10 | PR review comment fix | Root cause: `pull_request` events don't post visible comments unless `track_progress: true` forces tag mode; added that + `use_sticky_comment: true`. Confirmed live via `claude[bot]` comment on a test PR. |
| 2026-07-10 | Branch protection | `master` requires the `claude-review` check to pass before merge. Hit GitHub's free-tier private-repo restriction (403) — repo made **public** (scanned all tracked files + full git history for secrets first, clean) rather than pay for Pro. |
| 2026-07-10 | This playbook | Started per the Faction Group video — see rows below for the ongoing known-issues table. |

## Known issues

| Symptom | Root cause | Fix | Status | Tier |
|---|---|---|---|---|
| Double-scanning the same student same day created duplicate attendance rows | No uniqueness constraint on `(student_id, date(scanned_at))` | `UNIQUE INDEX idx_attendance_student_day` added, migration `0001_attendance_dedup.sql` | Fixed 2026-07-10 | 1 (now automatic — DB constraint rejects the duplicate insert) |
| `/admin` crashes after signing in through Cloudflare Access | **Unknown — not yet reproduced with a live error.** Redirect to Access login confirmed working (curl → 302); something breaks after actual sign-in. | TBD — re-run `wrangler tail --format pretty` against production, have Hazem reproduce it, read the real thrown error | **Open, urgent** | 2 (needs a human to reproduce once, then likely becomes tier 1 once the fix is known) |
| Attendance timestamps assume Egypt is always UTC+3 | Hardcoded offset, not real timezone handling | One-line fix if/when Egypt's DST rules change (they don't currently observe DST, so dormant risk) | Known, dormant | 1 (documented, no fix needed yet) |
| `teachers` table in D1 is a one-time snapshot import from the design-system repo's `data/teachers.json` | No sync mechanism | Re-run `node scripts/import-teachers.js` + re-apply generated SQL (local + remote) whenever the source roster changes | Known, manual process | — (operational, not a bug) |
| AI review comments weren't appearing on PRs | `pull_request` events need `track_progress: true` to force tag mode with tracking comments — default is off | Added `track_progress: true` + `use_sticky_comment: true` to `.github/workflows/ai-review.yml` | Fixed 2026-07-10 | 1 (documented, one-time workflow config) |
| Branch protection API returned 403 on the private repo | GitHub free tier doesn't allow branch protection on private repos (Pro-only feature) | Made `hazemzak/harv-attendance` public (secrets-scanned first) | Fixed 2026-07-10 | 1 (documented trade-off, not really a "bug") |
| `CLAUDE_CODE_OAUTH_TOKEN` will expire | `claude setup-token` tokens are valid 1 year from generation (2026-07-10) | Re-run `claude setup-token`, update the repo secret, before ~2027-07-10 | Scheduled, not yet due | 1 (dated reminder, also tracked in `TO DO.md`) |

## How to add to this playbook

When you ship a feature or fix a bug: add a row to the build log above (date, what, one-line detail) and, if it was a bug, a row to the known-issues table (symptom, root cause, fix, status, tier). If it's something a future agent could detect and fix automatically (a clear error signature + a mechanical fix), mark it tier 1 so it's ready when log-piping automation eventually gets built.
