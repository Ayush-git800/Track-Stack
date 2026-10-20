# TRACK STACK: Project Context

Track Stack is a production-grade Club Activities Management platform for Mirai School of Technology (MSOT), submitted as a college project against a formal brief. It must work like a real product: real auth, hosted database, file uploads, PDF certificates, permission checks. No fake data in the UI; everything is database-driven.

Principles: VERIFIED (every participation record backed by a check-in, a submission or an approval), LOW EFFORT for coordinators (run a Club Day from a phone in a few taps), STUDENT-OWNED RECORD (every student can download a verified co-curricular transcript).

## Campuses and clubs
Campuses: Delhi-NCR (primary, fully seeded), Bangalore, Jaipur (created, lightly seeded). Design for 4+ campuses, 30+ clubs, 1,000+ students.
Delhi-NCR societies: NexCell (Entrepreneurship Club), Malhar (The Cultural Society of Mirai), Khel Society (Sports Club), Kaizen Society (parent society with 3 clubs: Kaizen Dev Club, CP Club, Kaizen Intelligence / KI). So 4 societies, 6 joinable clubs. Model with clubs.parent_club_id. Joinable unit = club.

## Stack (fixed)
Next.js (latest, App Router) + TypeScript strict + Tailwind + shadcn/ui + Framer Motion (subtle) + Recharts + lucide-react. Supabase (hosted Postgres, Auth, Storage, Realtime, RLS on EVERY table). Server logic in Route Handlers/Server Actions validated with zod. PDFs: pdf-lib or @react-pdf/renderer; QR: qrcode. Email: Resend (console fallback if no key). Cron: Vercel Cron / pg_cron hitting protected endpoints. Tests: Vitest, Playwright, k6. Deploy: Vercel + Supabase cloud; also docker-compose + Supabase CLI for local. Installable PWA, mobile-first.

## Theme
Match the Track Stack logo: dark navy, glowing cyan-to-blue, techy and clean. Dark mode default plus light toggle.
Dark: bg #060B18, surface #0D1428, elevated #141C36, border #1F2A4D. Light: bg #F5F7FF, surface #FFFFFF.
Primary gradient: linear-gradient(135deg, #22D3EE 0%, #3B82F6 50%, #8B5CF6 100%). Accents: cyan #22D3EE, blue #3B82F6, violet #8B5CF6, success #34D399, warning #FBBF24, danger #F87171. Text #E6EBFF, muted #94A3C8.
Gradients on primary buttons, active nav, hero headings, charts, progress bars, card top-borders. Glassmorphism cards, rounded-2xl, 150-250ms transitions, visible focus rings, AA contrast. Fonts: Inter (UI), Sora or Space Grotesk (headings), tabular numbers in tables. Designed empty/loading/error states everywhere.
Club accent colours: NexCell #3B9BE0, Malhar #E8A935 on #14275E, Khel #1E6FC0, Kaizen Dev #4FA39A, CP #A3E635, KI #D9A441.

## Roles (enforce with RLS and server checks, not UI hiding)
admin (full control of everything incl. settings, users, roles, clubs, calendar, rubrics, templates, audit log), campus_manager (approves clubs for their campus, campus dashboards, Duty Leave approval, receives escalations/monthly reports), faculty_advisor (approves plans, evaluates, issues achievement certificates, only assigned clubs), student_coordinator (own club only: plan, run check-in, correct attendance with reason, evaluate, approve join requests), student (join clubs, check in, submit, view scores, download certificates/transcript). A user can hold different roles in different clubs.

## Auth
Login AND Register: email+password, Google sign-in, email OTP. Register collects name, campus, student ID, year of study, program, phone (optional). Email verification. New users = student; admin promotes. First admin from ADMIN_EMAIL env var. Demo accounts per role with quick-login buttons only when NEXT_PUBLIC_DEMO_MODE=true.

## Membership rule
Admin-editable settings: max_clubs_per_student default 2 (configurable per year of study), optional primary/secondary designation. Enforced in DB and UI. Capacity with waitlist.

## Security and quality
RLS everywhere; zod on all inputs; rate limiting (auth, check-in, uploads, chatbot); no secrets client-side; env validation at startup; signed URLs for files; idempotent check-in/registration endpoints; consistent error format; immutable audit log; ESLint + Prettier, no "any"; features organised by domain.

## Logos
Raw files in public/logos/raw/ are badly cropped; processed circular PNG/WebP versions go in public/logos/ and are the only ones used. Reusable <ClubLogo /> component with initials fallback. Never stretch logos (object-fit: contain).

## Feature checklist (official brief + chosen stretch)
Club registry; enrolment; Club Day calendar (import from CSV/Excel) and activity planning with advisor approval; Club Day flow automation (7 days plan, 3 days announce, check-in window, 48h submit, 5 days evaluate, monthly report); rotating-QR + one-time-code check-in with optional geo-check, late flags, device-reuse flags, corrections with reason; submissions with deadlines; rubric evaluation; events (Gambade, Hackathon, International Conference, Cross Road) with registration, teams, check-in, results; PDF certificates with HMAC signature and public verification page; dashboards and exports; stretch: co-curricular transcript, Duty Leave, announcements, notification centre, audit log screen; AI chatbot "Lumi".

## Workflow rule
Work in phases. After each phase print: what works, what is stubbed, exact commands to verify. Do not ask me questions; pick the best real-world option and record it in README under "Assumptions".
