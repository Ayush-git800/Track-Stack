-- ============================================================================
-- TRACK STACK: Phase 5 Database Schema Migration
-- Reporting, Announcements, Scheduled Flows, Notification Logs, Dashboard Views
-- ============================================================================

-- 1. MONTHLY CLUB REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  club_name TEXT NOT NULL,
  campus_id UUID NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
  campus_name TEXT NOT NULL,
  month TEXT NOT NULL, -- e.g. 'October 2026'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_members INTEGER NOT NULL DEFAULT 0,
  total_club_days INTEGER NOT NULL DEFAULT 0,
  total_attendances INTEGER NOT NULL DEFAULT 0,
  attendance_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  submissions_count INTEGER NOT NULL DEFAULT 0,
  evaluated_count INTEGER NOT NULL DEFAULT 0,
  average_score NUMERIC(4,2) NOT NULL DEFAULT 0.00,
  highlights TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'sent')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  sent_at TIMESTAMPTZ,
  pdf_url TEXT,
  csv_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_club_month_report UNIQUE(club_id, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_club ON public.monthly_reports(club_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_campus ON public.monthly_reports(campus_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_month ON public.monthly_reports(month);

-- 2. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  club_name TEXT NOT NULL,
  campus_id UUID REFERENCES public.campuses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  target_audience TEXT NOT NULL DEFAULT 'all_members' CHECK (target_audience IN ('all_members', 'coordinators', 'all_campus')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_announcements_club ON public.announcements(club_id);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON public.announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);

-- 3. IN-APP NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'reminder' CHECK (type IN ('reminder', 'announcement', 'approval', 'grade', 'duty_leave', 'system')),
  link_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_in_app_notif_user ON public.in_app_notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_in_app_notif_created ON public.in_app_notifications(created_at DESC);

-- 4. USER NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  club_reminders BOOLEAN NOT NULL DEFAULT true,
  submission_alerts BOOLEAN NOT NULL DEFAULT true,
  announcement_emails BOOLEAN NOT NULL DEFAULT true,
  duty_leave_updates BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. SENT NOTIFICATION LOGS (AUDIT OF ALL OUTBOUND EMAILS & IN-APP NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS public.sent_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'both' CHECK (channel IN ('email', 'in_app', 'both')),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'console_fallback')),
  template TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sent_notif_email ON public.sent_notification_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_sent_notif_date ON public.sent_notification_logs(sent_at DESC);

-- 6. CRON RUN LOGS (IDEMPOTENT AUTOMATION LEDGER)
CREATE TABLE IF NOT EXISTS public.cron_run_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('success', 'skipped', 'error')),
  items_processed INTEGER NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}',
  executed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cron_run_job ON public.cron_run_logs(job_name, executed_at DESC);

-- 7. PERFORMANCE VIEWS FOR DASHBOARDS (< 2s LOAD TIME)

-- View A: Student Participation Summary
CREATE OR REPLACE VIEW public.vw_student_participation_summary AS
SELECT
  p.id AS user_id,
  p.full_name AS student_name,
  p.student_id,
  p.email,
  p.campus_id,
  c.name AS campus_name,
  COUNT(DISTINCT cm.club_id) AS enrolled_clubs_count,
  COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.id END) AS total_attendances,
  COUNT(DISTINCT s.id) AS total_submissions,
  COALESCE(ROUND(AVG(e.rubric_scores->>'total')::numeric, 1), 0.0) AS avg_rubric_score,
  COUNT(DISTINCT cert.id) AS total_certificates
FROM public.profiles p
LEFT JOIN public.campuses c ON p.campus_id = c.id
LEFT JOIN public.club_members cm ON p.id = cm.user_id AND cm.status = 'approved'
LEFT JOIN public.attendances a ON p.id = a.user_id
LEFT JOIN public.submissions s ON p.id = s.user_id
LEFT JOIN public.evaluations e ON s.id = e.submission_id AND e.is_published = true
LEFT JOIN public.certificates cert ON p.id = cert.user_id AND cert.status = 'valid'
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.student_id, p.email, p.campus_id, c.name;

-- View B: Zero-Participation Students
CREATE OR REPLACE VIEW public.vw_zero_participation_students AS
SELECT *
FROM public.vw_student_participation_summary
WHERE total_attendances = 0 AND total_submissions = 0;

-- View C: Club Health Metrics
CREATE OR REPLACE VIEW public.vw_club_health_metrics AS
SELECT
  cl.id AS club_id,
  cl.name AS club_name,
  cl.category,
  cl.campus_id,
  camp.name AS campus_name,
  cl.status AS club_status,
  COUNT(DISTINCT cm.id) AS active_members,
  COUNT(DISTINCT act.id) AS total_activities,
  MAX(act.created_at) AS last_activity_date,
  COALESCE(
    ROUND((COUNT(DISTINCT CASE WHEN att.status = 'present' THEN att.id END)::numeric / 
    NULLIF(COUNT(DISTINCT cm.id) * NULLIF(COUNT(DISTINCT cd.id), 0), 0) * 100), 1),
    0.0
  ) AS attendance_pct
FROM public.clubs cl
LEFT JOIN public.campuses camp ON cl.campus_id = camp.id
LEFT JOIN public.club_members cm ON cl.id = cm.club_id AND cm.status = 'approved'
LEFT JOIN public.activities act ON cl.id = act.club_id
LEFT JOIN public.club_days cd ON cd.campus_id = cl.campus_id
LEFT JOIN public.attendances att ON cl.id = att.club_id AND att.status = 'present'
GROUP BY cl.id, cl.name, cl.category, cl.campus_id, camp.name, cl.status;

-- View D: Event Funnel
CREATE OR REPLACE VIEW public.vw_event_funnel AS
SELECT
  e.id AS event_id,
  e.name AS event_name,
  e.code,
  e.capacity,
  COUNT(DISTINCT r.id) AS total_registered,
  COUNT(DISTINCT CASE WHEN r.checked_in = true THEN r.id END) AS checked_in_count,
  COUNT(DISTINCT CASE WHEN r.position IS NOT NULL AND r.position != 'participant' THEN r.id END) AS podium_winners_count,
  COUNT(DISTINCT cert.id) AS certificates_issued_count
FROM public.events e
LEFT JOIN public.event_registrations r ON e.id = r.event_id AND r.status = 'confirmed'
LEFT JOIN public.certificates cert ON e.id = cert.event_id AND cert.status = 'valid'
GROUP BY e.id, e.name, e.code, e.capacity;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_run_logs ENABLE ROW LEVEL SECURITY;

-- Monthly Reports: Campus Managers and Admins read all, Coordinators read their club's
CREATE POLICY p_monthly_reports_select ON public.monthly_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'campus_manager'))
  OR club_id IN (SELECT club_id FROM public.club_members WHERE user_id = auth.uid() AND role IN ('coordinator', 'advisor'))
);

-- Announcements: Members read club announcements, coordinators/advisors insert/update
CREATE POLICY p_announcements_select ON public.announcements FOR SELECT USING (true);
CREATE POLICY p_announcements_insert ON public.announcements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'campus_manager', 'faculty_advisor', 'student_coordinator'))
);

-- Notifications: Users only see their own notifications
CREATE POLICY p_notifications_user ON public.in_app_notifications FOR ALL USING (user_id = auth.uid());

-- Preferences: Users manage their own preferences
CREATE POLICY p_preferences_user ON public.notification_preferences FOR ALL USING (user_id = auth.uid());
